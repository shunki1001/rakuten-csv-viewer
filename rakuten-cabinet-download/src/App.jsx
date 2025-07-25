// src/App.js
import React, { useState, useMemo } from "react";
import axios from "axios";
import {
  CloudArrowDownIcon,
  DocumentMagnifyingGlassIcon,
  FolderIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

// APIエンドポイントのURL（Cloud Functionsのデプロイ先）
const LIST_API_URL =
  "https://asia-northeast1-smarthome-428311.cloudfunctions.net/cabinet-directory-reader";
const ZIP_API_URL =
  "https://asia-northeast1-smarthome-428311.cloudfunctions.net/cabinet-files-downloader";

// --- Helper Functions ---

// ディレクトリパスの配列からツリー構造を構築
const buildTree = (directories) => {
  const tree = { name: "root", children: {} };

  directories.forEach((dir) => {
    // 先頭と末尾のスラッシュを削除し、パスを分割
    const parts = dir.folderPath.replace(/^\/|\/$/g, "").split("/");
    let currentNode = tree;

    parts.forEach((part, index) => {
      if (!currentNode.children[part]) {
        currentNode.children[part] = {
          name: part,
          children: {},
        };
      }
      // 最後の部分であれば、IDとフルパスを格納
      if (index === parts.length - 1) {
        currentNode.children[part].folderId = dir.folderId;
        currentNode.children[part].fullPath = dir.folderPath;
      }
      currentNode = currentNode.children[part];
    });
  });

  return tree.children;
};

// ツリーから特定のノードとその子孫のIDを再帰的に収集
const getIdsRecursively = (node) => {
  let ids = [];
  if (node.folderId) {
    ids.push(node.folderId);
  }
  Object.values(node.children).forEach((child) => {
    ids = ids.concat(getIdsRecursively(child));
  });
  return ids;
};

// --- Components ---

// ディレクトリツリーを再帰的に描画するコンポーネント
const DirectoryTree = ({
  nodes,
  level,
  onToggle,
  onSelect,
  selectedDirs,
  openFolders,
}) => {
  return (
    <div className="space-y-1">
      {Object.values(nodes)
        .sort((a, b) => a.name.localeCompare(b.name)) // 名前でソート
        .map((node) => {
          const isOpen = openFolders.has(node.fullPath);
          const hasChildren = Object.keys(node.children).length > 0;
          const isSelected = node.folderId && selectedDirs.has(node.folderId);

          return (
            <div key={node.fullPath || node.name}>
              <div
                className="flex items-center space-x-2 p-1 rounded-md hover:bg-indigo-50 cursor-pointer"
                style={{ paddingLeft: `${level * 1.5}rem` }}
              >
                {/* トグルアイコン */}
                <div className="w-4 h-4 flex items-center justify-center">
                  {hasChildren && (
                    <ChevronRightIcon
                      className={`h-4 w-4 text-slate-500 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggle(node.fullPath);
                      }}
                    />
                  )}
                </div>

                {/* チェックボックス */}
                {node.folderId && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(node)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                )}

                {/* フォルダアイコンと名前 */}
                <div
                  className="flex items-center space-x-2 flex-grow"
                  onClick={() => hasChildren && onToggle(node.fullPath)}
                >
                  <FolderIcon className="h-5 w-5 text-indigo-500" />
                  <span className="text-slate-700 select-none">
                    {node.name}
                  </span>
                </div>
              </div>

              {/* 子要素 */}
              {hasChildren && isOpen && (
                <DirectoryTree
                  nodes={node.children}
                  level={level + 1}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  selectedDirs={selectedDirs}
                  openFolders={openFolders}
                />
              )}
            </div>
          );
        })}
    </div>
  );
};

// --- Main App Component ---

function App() {
  const [credentials, setCredentials] = useState({
    serviceSecret: "",
    licenseKey: "",
  });
  const [directories, setDirectories] = useState([]);
  const [selectedDirs, setSelectedDirs] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFolders, setOpenFolders] = useState(new Set());

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

  // フォルダの開閉をトグル
  const handleToggleFolder = (path) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(path)) {
      newOpenFolders.delete(path);
    } else {
      newOpenFolders.add(path);
    }
    setOpenFolders(newOpenFolders);
  };

  // フォルダ選択の処理（子も含む）
  const handleSelectionChange = (node) => {
    const newSelection = new Set(selectedDirs);
    const idsToToggle = getIdsRecursively(node);
    const isSelected = idsToToggle.every((id) => newSelection.has(id));

    if (isSelected) {
      idsToToggle.forEach((id) => newSelection.delete(id));
    } else {
      idsToToggle.forEach((id) => newSelection.add(id));
    }
    setSelectedDirs(newSelection);
  };

  const handleDownload = async () => {
    setIsZipping(true);
    setError("");
    try {
      // 選択されたIDに対応するディレクトリ情報を取得
      const selectedFolderData = directories.filter((dir) =>
        selectedDirs.has(dir.folderId)
      );

      const response = await axios.post(ZIP_API_URL, {
        ...credentials,
        // IDとパスのペアをバックエンドに送信
        folders: selectedFolderData.map((dir) => ({
          folderId: dir.folderId,
          folderPath: dir.folderPath,
        })),
      });
      // ダウンロード用のURLを新しいタブで開く
      window.open(response.data.downloadUrl, "_blank");
    } catch (err) {
      setError("ダウンロードファイルの作成に失敗しました。");
      console.error(err);
    } finally {
      setIsZipping(false);
    }
  };

  // 検索とツリー構築をメモ化
  const directoryTree = useMemo(() => {
    if (directories.length === 0) return {};

    const filtered = searchTerm
      ? directories.filter((dir) =>
          dir.folderPath.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : directories;

    return buildTree(filtered);
  }, [directories, searchTerm]);

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
            {/* 検索バー */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>

            {/* ディレクトリツリー */}
            <div className="max-h-72 overflow-y-auto border rounded-lg p-2 bg-slate-50/50">
              <DirectoryTree
                nodes={directoryTree}
                level={0}
                onToggle={handleToggleFolder}
                onSelect={handleSelectionChange}
                selectedDirs={selectedDirs}
                openFolders={openFolders}
              />
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
