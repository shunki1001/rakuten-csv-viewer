// src/App.js
import React, { useState } from "react";
import axios from "axios";
import {
  CloudArrowDownIcon,
  DocumentMagnifyingGlassIcon,
} from "@heroicons/react/24/outline"; // アイコン用にライブラリを導入

// アイコンのインストール: npm install @heroicons/react

// APIエンドポイントのURL（Cloud Functionsのデプロイ先）
const LIST_API_URL =
  "https://<region>-<project-id>.cloudfunctions.net/list-directories";
const ZIP_API_URL =
  "https://<region>-<project-id>.cloudfunctions.net/create-zip-download";

function App() {
  // --- 状態管理 (変更なし) ---
  const [credentials, setCredentials] = useState({
    serviceSecret: "",
    licenseKey: "",
  });
  const [directories, setDirectories] = useState([]);
  const [selectedDirs, setSelectedDirs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState("");

  // --- 関数 (変更なし) ---
  const handleCredentialChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const fetchDirectories = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await axios.post(LIST_API_URL, credentials);
      setDirectories(response.data);
    } catch (err) {
      setError(
        "ディレクトリの取得に失敗しました。キーが正しいか確認してください。"
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectionChange = (folderId) => {
    const newSelection = new Set(selectedDirs);
    if (newSelection.has(folderId)) {
      newSelection.delete(folderId);
    } else {
      newSelection.add(folderId);
    }
    setSelectedDirs(newSelection);
  };

  const handleDownload = async () => {
    setIsZipping(true);
    setError("");
    try {
      const response = await axios.post(ZIP_API_URL, {
        ...credentials,
        folderIds: Array.from(selectedDirs),
      });
      window.location.href = response.data.downloadUrl;
    } catch (err) {
      setError("ダウンロードファイルの作成に失敗しました。");
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center font-sans p-4">
      <div className="w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">
            楽天Cabinetダウンローダー
          </h1>
          <p className="text-slate-500 mt-2">
            指定したディレクトリのファイルを一括でダウンロードします。
          </p>
        </header>

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">エラー</p>
            <p>{error}</p>
          </div>
        )}

        {/* --- ステップ1: 認証情報 --- */}
        <div className="p-5 border rounded-lg bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Step 1: 認証情報を入力
          </h2>
          <div className="space-y-4">
            <input
              name="serviceSecret"
              placeholder="Service Secret"
              onChange={handleCredentialChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={isLoading || isZipping}
            />
            <input
              name="licenseKey"
              placeholder="License Key"
              type="password"
              onChange={handleCredentialChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              disabled={isLoading || isZipping}
            />
            <button
              onClick={fetchDirectories}
              disabled={
                isLoading ||
                !credentials.serviceSecret ||
                !credentials.licenseKey
              }
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  取得中...
                </>
              ) : (
                <>
                  <DocumentMagnifyingGlassIcon className="h-5 w-5" />
                  ディレクトリ一覧を取得
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- ステップ2: ディレクトリ選択 --- */}
        {directories.length > 0 && (
          <div className="p-5 border rounded-lg">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Step 2: ディレクトリを選択
            </h2>
            <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2 bg-slate-50/50">
              {directories.map((dir) => (
                <label
                  key={dir.folderId}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-indigo-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedDirs.has(dir.folderId)}
                    onChange={() => handleSelectionChange(dir.folderId)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    disabled={isZipping}
                  />
                  <span className="text-slate-700 select-none">
                    {dir.folderPath}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* --- ステップ3: ダウンロード --- */}
        {directories.length > 0 && (
          <div className="p-5 border rounded-lg bg-slate-50/50">
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Step 3: ダウンロードを実行
            </h2>
            <button
              onClick={handleDownload}
              disabled={isZipping || selectedDirs.size === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 text-white font-semibold rounded-lg hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isZipping ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Zipファイル作成中...
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="h-5 w-5" />
                  {selectedDirs.size}件のディレクトリをダウンロード
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
