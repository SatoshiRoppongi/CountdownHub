import React, { useState, useEffect } from 'react';
import { EventFilters } from '../types';
import { useSearchHistory } from '../hooks/useSearchHistory';

interface AdvancedSearchPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: EventFilters) => void;
  initialFilters?: EventFilters;
}

export const AdvancedSearchPanel: React.FC<AdvancedSearchPanelProps> = ({
  isOpen,
  onClose,
  onSearch,
  initialFilters = {}
}) => {
  const { saveSearch, getPopularTags } = useSearchHistory();
  const [filters, setFilters] = useState<EventFilters>({
    search: '',
    tags: [],
    venue_type: undefined,
    sort_by: 'start_datetime',
    order: 'asc',
    ...initialFilters
  });

  const [tempFilters, setTempFilters] = useState(filters);
  const [tagInput, setTagInput] = useState('');
  const [dateRange, setDateRange] = useState({
    start_date: '',
    end_date: ''
  });
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTempFilters(filters);
    }
  }, [isOpen, filters]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tempFilters.tags?.includes(tagInput.trim())) {
      setTempFilters(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTempFilters(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSearch = () => {
    const searchFilters: EventFilters = {
      ...tempFilters,
      tags: tempFilters.tags?.length ? tempFilters.tags : undefined
    };

    // 日付範囲フィルターを追加（カスタム実装）
    if (dateRange.start_date || dateRange.end_date) {
      searchFilters.dateRange = dateRange;
    }

    setFilters(searchFilters);
    onSearch(searchFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: EventFilters = {
      search: '',
      tags: [],
      venue_type: undefined,
      sort_by: 'start_datetime',
      order: 'asc'
    };
    setTempFilters(resetFilters);
    setTagInput('');
    setDateRange({ start_date: '', end_date: '' });
  };

  const handleSave = () => {
    if (!saveName.trim()) return;
    
    const searchFilters: EventFilters = {
      ...tempFilters,
      tags: tempFilters.tags?.length ? tempFilters.tags : undefined
    };

    if (dateRange.start_date || dateRange.end_date) {
      searchFilters.dateRange = dateRange;
    }

    const success = saveSearch(searchFilters, saveName.trim());
    if (success) {
      setShowSaveDialog(false);
      setSaveName('');
      // 成功メッセージを表示（簡易版）
      alert('検索条件を保存しました！');
    }
  };

  const popularTags = getPopularTags();

  // Escapeキーでパネルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // モーダル表示時のスクロール防止
      document.body.style.overflow = 'hidden';
    } else {
      // パネルが閉じられた時に確実にbodyのstyleをクリア
      document.body.style.cssText = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // クリーンアップ時も確実にbodyのstyleをクリア
      document.body.style.cssText = '';
    };
  }, [isOpen, onClose]);

  // コンポーネントアンマウント時の確実なクリーンアップ
  useEffect(() => {
    return () => {
      document.body.style.cssText = '';
    };
  }, []);

  if (!isOpen) {
    console.log('🔧 AdvancedSearchPanel: not open, returning null');
    return null;
  }
  
  console.log('🔧 AdvancedSearchPanel: rendering modal');

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">🔍 高度な検索</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 検索フォーム */}
        <div className="p-6 space-y-6">
          {/* キーワード検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🔎 キーワード検索
            </label>
            <input
              type="text"
              value={tempFilters.search || ''}
              onChange={(e) => setTempFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="イベント名、説明文で検索..."
            />
            <p className="text-xs text-gray-500 mt-1">
              タイトル、説明文、場所から検索されます
            </p>
          </div>

          {/* タグ検索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏷️ タグ検索
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="タグを入力してEnter"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                追加
              </button>
            </div>
            
            {/* 選択されたタグ */}
            {tempFilters.tags && tempFilters.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tempFilters.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* 人気タグクイック選択 */}
            <div>
              <p className="text-xs text-gray-600 mb-2">
                {popularTags.length > 0 ? '人気タグから選択:' : 'おすすめタグから選択:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {(popularTags.length > 0 ? popularTags : ['React', 'JavaScript', 'TypeScript', 'Node.js', 'Vue', 'Angular', 'Python', 'AI', 'Web3']).map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      if (!tempFilters.tags?.includes(tag)) {
                        setTempFilters(prev => ({
                          ...prev,
                          tags: [...(prev.tags || []), tag]
                        }));
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      popularTags.includes(tag)
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                    {popularTags.includes(tag) && <span className="ml-1">🔥</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 開催形式フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🏢 開催形式
            </label>
            <div className="flex space-x-4">
              {[
                { value: undefined as undefined, label: 'すべて', icon: '🌐' },
                { value: 'online' as const, label: 'オンライン', icon: '💻' },
                { value: 'offline' as const, label: 'オフライン', icon: '🏢' },
                { value: 'hybrid' as const, label: 'ハイブリッド', icon: '🔄' }
              ].map(option => (
                <button
                  key={option.label}
                  onClick={() => setTempFilters(prev => ({ ...prev, venue_type: option.value }))}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md border transition-colors ${
                    tempFilters.venue_type === option.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 日付範囲フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📅 開催日期間
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">開始日</label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">終了日</label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* ソート設定 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 並び順
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">並び基準</label>
                <select
                  value={tempFilters.sort_by || 'start_datetime'}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, sort_by: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="start_datetime">開催日時</option>
                  <option value="created_at">登録日時</option>
                  <option value="comments">コメント数</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">順序</label>
                <select
                  value={tempFilters.order || 'asc'}
                  onChange={(e) => setTempFilters(prev => ({ ...prev, order: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="asc">昇順</option>
                  <option value="desc">降順</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="flex justify-between space-x-4 p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="px-6 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            リセット
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowSaveDialog(true)}
              className="px-6 py-2 text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
            >
              ⭐ 保存
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              検索実行
            </button>
          </div>
        </div>

        {/* 保存ダイアログ */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 m-4 w-full max-w-md">
              <h3 className="text-lg font-medium text-gray-900 mb-4">検索条件を保存</h3>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="保存名を入力..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                onKeyPress={(e) => e.key === 'Enter' && handleSave()}
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleSave}
                  disabled={!saveName.trim()}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};