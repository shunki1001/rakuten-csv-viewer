# main.py
import base64
import io
import uuid
import xml.etree.ElementTree as ET
import zipfile
from datetime import timedelta

import functions_framework
import google.auth
import requests
from flask import jsonify
from google.cloud import storage

# 定数
BUCKET_NAME = "fbrains-tools-bucket"  # 事前に作成したGCSバケット名

# CORSのためのヘッダー（本番環境ではフロントエンドのドメインに限定すべき）
CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}


def get_rakuten_folders(service_secret, license_key):
    """楽天APIを叩いてフォルダ一覧を取得する内部関数"""
    b64_string = f"{service_secret}:{license_key}".encode()
    auth_header = b"ESA " + base64.b64encode(b64_string)
    headers = {"Authorization": auth_header}

    all_folders = []
    offset = 1
    is_loop = True

    while is_loop:
        params = {"offset": offset, "limit": 100}
        response = requests.get(
            "https://api.rms.rakuten.co.jp/es/1.0/cabinet/folders/get",
            headers=headers,
            params=params,
        )
        response.raise_for_status()  # エラーがあれば例外を発生

        root = ET.fromstring(response.content)
        folders_in_page = root.findall(".//folder")

        for folder in folders_in_page:
            # 必要な情報だけを抽出
            all_folders.append(
                {
                    "folderId": folder.find("FolderId").text,
                    "folderPath": folder.find("FolderPath").text,
                }
            )

        is_loop = len(folders_in_page) == 100
        offset += 1

    return all_folders


@functions_framework.http
def list_directories(request):
    """HTTPリクエストを受け取り、ディレクトリ一覧を返す関数"""
    # pre-flightリクエストへの対応
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "POST":
        return ("Method Not Allowed", 405, CORS_HEADERS)

    try:
        data = request.get_json()
        service_secret = data["serviceSecret"]
        license_key = data["licenseKey"]

        # 楽天APIからフォルダ一覧を取得
        folders = get_rakuten_folders(service_secret, license_key)

        # ここで特定のフォルダ（例：/tj/を含むなど）に絞り込んでも良い
        # filtered_folders = [f for f in folders if '/tj/' in f['folderPath']]

        return (jsonify(folders), 200, CORS_HEADERS)

    except Exception as e:
        return (jsonify({"error": str(e)}), 500, CORS_HEADERS)


def get_files_in_folder(service_secret, license_key, folder_id):
    """指定されたフォルダ内のファイル一覧を取得する内部関数"""
    # (list_directoriesと同様の認証ヘッダーを作成)
    b64_string = f"{service_secret}:{license_key}".encode()
    auth_header = b"ESA " + base64.b64encode(b64_string)
    headers = {"Authorization": auth_header}
    params = {"folderId": folder_id}

    response = requests.get(
        "https://api.rms.rakuten.co.jp/es/1.0/cabinet/folder/files/get",
        headers=headers,
        params=params,
    )
    response.raise_for_status()

    root = ET.fromstring(response.content)
    files = []
    for file_node in root.findall(".//file"):
        files.append(
            {
                "fileName": file_node.find("FileName").text,
                "filePath": file_node.find("FilePath").text,
                "fileUrl": file_node.find("FileUrl").text,
            }
        )
    return files


@functions_framework.http
def create_zip_download(request):
    """選択されたフォルダのファイルをzip化し、ダウンロードURLのリストを返す関数。ZIPファイルが約25MBを超えないように分割します。"""
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "POST":
        return ("Method Not Allowed", 405, CORS_HEADERS)

    try:
        data = request.get_json()
        service_secret = data["serviceSecret"]
        license_key = data["licenseKey"]
        folders = data["folders"]  # フロントから {folderId, folderPath} の配列を受け取る

        MAX_SIZE = 25 * 1024 * 1024  # 25MB
        download_urls = []

        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        credentials, _ = google.auth.default()

        def upload_zip_and_get_url(zip_buffer_to_upload):
            """Helper function to upload a zip buffer to GCS and return a signed URL."""
            zip_buffer_to_upload.seek(0)
            zip_filename = f"downloads/{uuid.uuid4()}.zip"
            blob = bucket.blob(zip_filename)
            blob.upload_from_file(zip_buffer_to_upload, content_type="application/zip")

            # The service account needs roles/iam.serviceAccountTokenCreator.
            # Refresh token to be safe, as signing URLs for multiple zips might take time.
            credentials.refresh(google.auth.transport.requests.Request())
            signed_url = blob.generate_signed_url(
                version="v4",
                expiration=timedelta(minutes=15),
                method="GET",
                service_account_email=credentials.service_account_email,
                access_token=credentials.token,
            )
            return signed_url

        zip_buffer = io.BytesIO()
        zf = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)
        current_zip_uncompressed_size = 0

        for folder in folders:
            folder_id = folder["folderId"]
            folder_path = folder["folderPath"].strip("/")  # Remove leading/trailing slashes

            files = get_files_in_folder(service_secret, license_key, folder_id)
            for file_info in files:
                try:
                    image_url = file_info["fileUrl"]
                    image_res = requests.get(image_url, timeout=30)
                    if image_res.status_code != 200:
                        continue

                    image_content = image_res.content
                    image_size = len(image_content)

                    # If adding this file would exceed the limit (and the zip isn't empty),
                    # finalize and upload the current zip. A single file larger than MAX_SIZE
                    # will be in its own zip file.
                    if (
                        current_zip_uncompressed_size > 0
                        and (current_zip_uncompressed_size + image_size) > MAX_SIZE
                    ):
                        zf.close()
                        url = upload_zip_and_get_url(zip_buffer)
                        download_urls.append(url)

                        # Start a new zip
                        zip_buffer = io.BytesIO()
                        zf = zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED)
                        current_zip_uncompressed_size = 0

                    file_name_from_path = file_info["filePath"].split("/")[-1]
                    zip_path = f"{folder_path}/{file_name_from_path}"
                    zf.writestr(zip_path, image_content)
                    current_zip_uncompressed_size += image_size

                except requests.exceptions.RequestException:
                    # Skip files that fail to download
                    continue

        # Upload the last zip file if it contains any data
        if current_zip_uncompressed_size > 0:
            zf.close()
            url = upload_zip_and_get_url(zip_buffer)
            download_urls.append(url)

        return (jsonify({"downloadUrls": download_urls}), 200, CORS_HEADERS)

    except Exception as e:
        return (jsonify({"error": str(e)}), 500, CORS_HEADERS)
