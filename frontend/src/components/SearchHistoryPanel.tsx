import React, { useState, useEffect } from 'react';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { EventFilters } from '../types';

interface SearchHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearch: (filters: EventFilters) => void;
}

export const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
  isOpen,
  onClose,
  onSelectSearch
}) => {
  const {
    history,
    savedSearches,
    deleteHistoryItem,
    deleteSavedSearch,
    clearHistory,
    getPopularSearchTerms,
    getPopularTags
  } = useSearchHistory();

  const [activeTab, setActiveTab] = useState<'history' | 'saved' | 'popular'>('history');

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return '1時間以内';
    } else if (diffHours < 24) {
      return `${diffHours}時間前`;
    } else if (diffDays < 7) {
      return `${diffDays}日前`;
    } else {
      return date.toLocaleDateString('ja-JP');
    }
  };

  const popularTerms = getPopularSearchTerms();
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
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* ヘッダー */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">📚 検索履歴</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* タブナビゲーション */}
        <div className="flex border-b border-gray-200">
          {[
            { id: 'history', label: '履歴', icon: '🕒' },
            { id: 'saved', label: '保存済み', icon: '⭐' },
            { id: 'popular', label: '人気', icon: '🔥' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'history' && history.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1">
                  {history.length}
                </span>
              )}
              {tab.id === 'saved' && savedSearches.length > 0 && (
                <span className="bg-blue-100 text-blue-600 text-xs rounded-full px-2 py-1">
                  {savedSearches.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 検索履歴タブ */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {history.length > 0 ? (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">最近の検索</h3>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      すべて削除
                    </button>
                  </div>
                  
                  {history.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => {
                          onSelectSearch(item.filters);
                          onClose();
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-gray-900 mb-1">{item.query}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          {item.resultCount !== undefined && (
                            <span>{item.resultCount}件</span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.id)}
                        className="text-gray-400 hover:text-red-600 ml-3"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🔍</div>
                  <p>検索履歴はありません</p>
                  <p className="text-sm">検索を実行すると履歴が表示されます</p>
                </div>
              )}
            </div>
          )}

          {/* 保存済み検索タブ */}
          {activeTab === 'saved' && (
            <div className="space-y-4">
              {savedSearches.length > 0 ? (
                <>
                  <h3 className="text-lg font-medium text-gray-900">保存済み検索</h3>
                  
                  {savedSearches.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <button
                        onClick={() => {
                          onSelectSearch(item.filters);
                          onClose();
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="font-medium text-gray-900 mb-1 flex items-center space-x-2">
                          <span>⭐</span>
                          <span>{item.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">{item.query}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <span>{formatTimestamp(item.timestamp)}</span>
                          {item.resultCount !== undefined && (
                            <span>{item.resultCount}件</span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => deleteSavedSearch(item.id)}
                        className="text-gray-400 hover:text-red-600 ml-3"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">⭐</div>
                  <p>保存済み検索はありません</p>
                  <p className="text-sm">高度な検索から検索条件を保存できます</p>
                </div>
              )}
            </div>
          )}

          {/* 人気検索タブ */}
          {activeTab === 'popular' && (
            <div className="space-y-6">
              {/* 人気キーワード */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🔥 人気キーワード</h3>
                {popularTerms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {popularTerms.map(term => (
                      <button
                        key={term}
                        onClick={() => {
                          onSelectSearch({ search: term });
                          onClose();
                        }}
                        className="px-3 py-2 bg-red-50 text-red-700 rounded-full text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">まだ人気キーワードはありません</p>
                )}
              </div>

              {/* 人気タグ */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">🏷️ 人気タグ</h3>
                {popularTags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          onSelectSearch({ tags: [tag] });
                          onClose();
                        }}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">まだ人気タグはありません</p>
                )}
              </div>

              {/* 説明 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  💡 人気キーワードとタグは、あなたの検索履歴と保存済み検索から自動的に集計されます。
                </p>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};