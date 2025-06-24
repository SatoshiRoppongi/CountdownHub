import React from 'react';

interface SearchHighlightProps {
  text: string;
  searchTerm?: string;
  className?: string;
}

export const SearchHighlight: React.FC<SearchHighlightProps> = ({ 
  text, 
  searchTerm, 
  className = '' 
}) => {
  if (!searchTerm || !text) {
    return <span className={className}>{text}</span>;
  }

  // 大文字小文字を区別しない検索
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark 
            key={index} 
            className="bg-yellow-200 text-yellow-900 px-1 rounded font-medium"
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

interface SearchResultSummaryProps {
  totalResults: number;
  searchTerm?: string;
  appliedFilters: {
    tags?: string[];
    venue_type?: string;
    dateRange?: { start_date: string; end_date: string };
  };
  onClearFilter: (filterType: string, value?: string) => void;
  onClearAll: () => void;
}

export const SearchResultSummary: React.FC<SearchResultSummaryProps> = ({
  totalResults,
  searchTerm,
  appliedFilters,
  onClearFilter,
  onClearAll
}) => {
  const hasFilters = searchTerm || 
    (appliedFilters.tags && appliedFilters.tags.length > 0) ||
    appliedFilters.venue_type ||
    (appliedFilters.dateRange && (appliedFilters.dateRange.start_date || appliedFilters.dateRange.end_date));

  if (!hasFilters) {
    return null;
  }

  const getVenueTypeLabel = (type: string) => {
    switch (type) {
      case 'online': return '💻 オンライン';
      case 'offline': return '🏢 オフライン';
      case 'hybrid': return '🔄 ハイブリッド';
      default: return type;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            {/* キーワード検索 */}
            {searchTerm && (
              <div className="inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
                <span className="text-sm text-gray-700">
                  キーワード: "{searchTerm}"
                </span>
                <button
                  type="button"
                  onClick={() => onClearFilter('search')}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            )}

            {/* タグフィルター */}
            {appliedFilters.tags?.map(tag => (
              <div key={tag} className="inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
                <span className="text-sm text-gray-700">
                  🏷️ {tag}
                </span>
                <button
                  type="button"
                  onClick={() => onClearFilter('tag', tag)}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            ))}

            {/* 開催形式フィルター */}
            {appliedFilters.venue_type && (
              <div className="inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
                <span className="text-sm text-gray-700">
                  {getVenueTypeLabel(appliedFilters.venue_type)}
                </span>
                <button
                  type="button"
                  onClick={() => onClearFilter('venue_type')}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            )}

            {/* 日付範囲フィルター */}
            {appliedFilters.dateRange && (appliedFilters.dateRange.start_date || appliedFilters.dateRange.end_date) && (
              <div className="inline-flex items-center bg-gray-100 border border-gray-300 rounded-full px-3 py-1">
                <span className="text-sm text-gray-700">
                  📅 {appliedFilters.dateRange.start_date ? formatDate(appliedFilters.dateRange.start_date) : '開始日未設定'}
                  {' ～ '}
                  {appliedFilters.dateRange.end_date ? formatDate(appliedFilters.dateRange.end_date) : '終了日未設定'}
                </span>
                <button
                  type="button"
                  onClick={() => onClearFilter('dateRange')}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 全クリアボタン */}
        <button
          type="button"
          onClick={onClearAll}
          className="text-sm text-gray-600 hover:text-gray-800 underline whitespace-nowrap"
        >
          すべてクリア
        </button>
      </div>
    </div>
  );
};