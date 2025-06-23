import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAPI } from '../services/api';

interface ImportResult {
  message: string;
  count: number;
}

const EventCSVImport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => adminAPI.importEventsFromCSV(file),
    onSuccess: (data) => {
      setImportResult(data);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // イベント一覧を再取得
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error) => {
      console.error('CSV import error:', error);
    }
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      if (files[0].type === 'text/csv' || files[0].name.endsWith('.csv')) {
        setSelectedFile(files[0]);
      } else {
        alert('CSVファイルを選択してください。');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `title,description,start_datetime,end_datetime,location,venue_type,site_url,image_url,tags
サンプルイベント,これはサンプルイベントです,2024-01-01T10:00:00Z,2024-01-01T12:00:00Z,東京都渋谷区,offline,https://example.com,https://example.com/image.jpg,"技術,セミナー"
オンラインセミナー,オンラインでのセミナーです,2024-01-15T14:00:00Z,2024-01-15T16:00:00Z,,online,https://zoom.us/meeting,,"セミナー,オンライン"`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'events_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        CSVファイルによるイベント一括登録
      </h3>

      {/* CSVテンプレートダウンロード */}
      <div className="mb-6">
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div>
            <h4 className="font-medium text-blue-900">CSVテンプレート</h4>
            <p className="text-sm text-blue-700 mt-1">
              まずテンプレートをダウンロードして、フォーマットを確認してください
            </p>
          </div>
          <button
            onClick={downloadTemplate}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            テンプレートダウンロード
          </button>
        </div>
      </div>

      {/* ファイルアップロード */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          CSVファイルを選択
        </label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : selectedFile
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {selectedFile ? (
            <div className="text-green-700">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">選択されたファイル: {selectedFile.name}</p>
              <p className="text-sm">サイズ: {(selectedFile.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="mb-2">CSVファイルをドラッグ&ドロップ または</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ファイルを選択
              </button>
            </div>
          )}
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex space-x-3">
        <button
          onClick={handleImport}
          disabled={!selectedFile || importMutation.isPending}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {importMutation.isPending ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              インポート中...
            </span>
          ) : (
            'イベントをインポート'
          )}
        </button>
        
        {selectedFile && (
          <button
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            クリア
          </button>
        )}
      </div>

      {/* インポート結果 */}
      {importResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-green-800 font-medium">{importResult.message}</p>
          </div>
        </div>
      )}

      {/* エラー表示 */}
      {importMutation.isError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">
              インポートに失敗しました。CSVファイルの形式を確認してください。
            </p>
          </div>
        </div>
      )}

      {/* フォーマット説明 */}
      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">CSVフォーマット説明</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>title</strong>: イベントタイトル（必須）</p>
          <p><strong>description</strong>: イベント説明（任意）</p>
          <p><strong>start_datetime</strong>: 開始日時（必須、ISO8601形式: 2024-01-01T10:00:00Z）</p>
          <p><strong>end_datetime</strong>: 終了日時（任意、ISO8601形式）</p>
          <p><strong>location</strong>: 開催場所（任意）</p>
          <p><strong>venue_type</strong>: 開催形式（任意: online, offline, hybrid）</p>
          <p><strong>site_url</strong>: 関連URL（任意）</p>
          <p><strong>image_url</strong>: 画像URL（任意）</p>
          <p><strong>tags</strong>: タグ（任意、カンマ区切り）</p>
        </div>
      </div>
    </div>
  );
};

export default EventCSVImport;