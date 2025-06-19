import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminStats, useImportEventsFromCSV } from '../hooks/useAdmin';

export const AdminDashboard: React.FC = () => {
  const { data: stats, isLoading: statsLoading, error: statsError } = useAdminStats();
  const importMutation = useImportEventsFromCSV();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      alert('CSVファイルを選択してください');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const result = await importMutation.mutateAsync(selectedFile);
      alert(`${result.count}件のイベントを正常にインポートしました`);
      setSelectedFile(null);
    } catch (error) {
      alert('インポートに失敗しました。ファイル形式を確認してください。');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ナビゲーション */}
      <nav className="mb-6">
        <Link 
          to="/"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← イベント一覧に戻る
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⚙️ 管理者ダッシュボード
          </h1>
          <p className="text-gray-600">
            イベントとコメントの管理、一括インポート機能
          </p>
        </div>

        {/* 統計情報 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : statsError ? (
            <div className="col-span-3 bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-600 text-center">
                統計情報の読み込みに失敗しました
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">総イベント数</p>
                    <p className="text-3xl font-bold text-blue-600">{stats?.events || 0}</p>
                  </div>
                  <div className="text-4xl">📅</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">総コメント数</p>
                    <p className="text-3xl font-bold text-green-600">{stats?.comments || 0}</p>
                  </div>
                  <div className="text-4xl">💬</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">通報されたコメント</p>
                    <p className="text-3xl font-bold text-red-600">{stats?.reportedComments || 0}</p>
                  </div>
                  <div className="text-4xl">🚨</div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* CSV一括インポート */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            📊 CSVファイル一括インポート
          </h2>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              CSVファイルからイベントを一括で登録できます。
            </p>
            <div className="text-sm text-gray-500">
              <p>必要な列: title, description, start_datetime, location, venue_type, site_url, tags</p>
              <p>日時形式: YYYY-MM-DD HH:MM:SS</p>
              <p>タグ: カンマ区切り</p>
            </div>
          </div>

          {/* ファイルアップロード */}
          <div className="mb-6">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  CSVファイルをドラッグ&ドロップ
                </p>
                <p className="text-gray-500 mb-4">
                  または、クリックしてファイルを選択
                </p>
                <div className="inline-block bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  ファイルを選択
                </div>
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* インポートボタン */}
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {importMutation.isPending ? 'インポート中...' : 'インポート実行'}
            </button>
          </div>

          {importMutation.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">
                インポートに失敗しました。ファイル形式を確認してください。
              </p>
            </div>
          )}
        </div>

        {/* CSVフォーマット例 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            📋 CSVフォーマット例
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700">
{`title,description,start_datetime,end_datetime,location,venue_type,site_url,tags
"React Conference 2025","最新のReact技術について学ぶカンファレンス","2025-07-15 10:00:00","2025-07-15 18:00:00","東京都渋谷区","offline","https://reactconf.jp","React,JavaScript,Frontend"
"オンライン勉強会","Node.jsについて学ぶオンライン勉強会","2025-08-01 19:00:00","2025-08-01 21:00:00","オンライン","online","https://study.example.com","Node.js,Backend"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};