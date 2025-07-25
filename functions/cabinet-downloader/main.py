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
    """選択されたフォルダのファイルをzip化し、ダウンロードURLを返す関数"""
    if request.method == "OPTIONS":
        return ("", 204, CORS_HEADERS)

    if request.method != "POST":
        return ("Method Not Allowed", 405, CORS_HEADERS)

    try:
        data = request.get_json()
        service_secret = data["serviceSecret"]
        license_key = data["licenseKey"]
        folders = data["folders"]  # フロントから {folderId, folderPath} の配列を受け取る

        # インメモリでzipファイルを作成
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            for folder in folders:
                folder_id = folder["folderId"]
                folder_path = folder["folderPath"].strip("/") # 前後のスラッシュを削除

                files = get_files_in_folder(service_secret, license_key, folder_id)
                for file_info in files:
                    # 画像のURLから直接コンテンツを取得
                    image_url = file_info["fileUrl"]
                    image_res = requests.get(image_url)
                    if image_res.status_code == 200:
                        # filePathからファイル名（拡張子込み）を取得
                        file_name_from_path = file_info["filePath"].split("/")[-1]
                        # zip内のパスを構築
                        zip_path = f"{folder_path}/{file_name_from_path}"
                        zf.writestr(zip_path, image_res.content)

        zip_buffer.seek(0)

        # GCSにアップロード
        storage_client = storage.Client()
        bucket = storage_client.bucket(BUCKET_NAME)
        zip_filename = f"downloads/{uuid.uuid4()}.zip"  # ユニークなファイル名
        blob = bucket.blob(zip_filename)

        blob.upload_from_file(zip_buffer, content_type="application/zip")

        # Cloud Functionsのデフォルトサービスアカウントは直接署名できないため、
        # IAM APIを介して署名を行う。そのためには、サービスアカウントのメールアドレスが必要。
        credentials, _ = google.auth.default()
        credentials.refresh(google.auth.transport.requests.Request())
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),  # URLの有効期限を15分に設定
            method="GET",
            service_account_email=credentials.service_account_email,
            access_token=credentials.token,
        )

        return (jsonify({"downloadUrl": signed_url}), 200, CORS_HEADERS)

    except Exception as e:
        return (jsonify({"error": str(e)}), 500, CORS_HEADERS)
