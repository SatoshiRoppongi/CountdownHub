import React, { useState, useEffect, useMemo } from 'react';
import { useInfiniteEvents } from '../hooks/useInfiniteEvents';
import { EventTimeTabs } from '../components/EventTimeTabs';
import { AdvancedSearchPanel } from '../components/AdvancedSearchPanel';
import { SearchHistoryPanel } from '../components/SearchHistoryPanel';
import { SearchResultSummary } from '../components/SearchHighlight';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { EventFilters } from '../types';

interface EventListPageProps {
  searchQuery?: string;
  showAdvancedSearch?: boolean;
  showSearchHistory?: boolean;
  onAdvancedSearchClose?: () => void;
  onSearchHistoryClose?: () => void;
}

export const EventListPage: React.FC<EventListPageProps> = ({ 
  searchQuery,
  showAdvancedSearch,
  showSearchHistory,
  onAdvancedSearchClose,
  onSearchHistoryClose
}) => {
  const [filters, setFilters] = useState<EventFilters>({
    sort_by: 'start_datetime',
    order: 'asc'
  });
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const { addToHistory } = useSearchHistory();
  
  // ヘッダーからの検索クエリを反映
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery || undefined
    }));
  }, [searchQuery]);

  // ヘッダーからのパネル表示制御
  useEffect(() => {
    if (showAdvancedSearch) {
      setShowAdvancedPanel(true);
    }
  }, [showAdvancedSearch]);

  useEffect(() => {
    if (showSearchHistory) {
      setShowHistoryPanel(true);
    }
  }, [showSearchHistory]);

  const handleAdvancedSearch = (newFilters: EventFilters) => {
    setFilters(newFilters);
  };

  const handleHistorySearch = (newFilters: EventFilters) => {
    setFilters(newFilters);
  };

  const { 
    data, 
    isLoading, 
    error, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage 
  } = useInfiniteEvents({ ...filters, limit: 20 });

  // 全ページのイベントをフラット化
  const allEvents = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap(page => page.events);
  }, [data]);

  // 合計イベント数を計算
  const totalEvents = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) return 0;
    return data.pages[0].pagination?.total ?? 0;
  }, [data]);

  // 検索結果が取得されたら履歴に追加
  useEffect(() => {
    if (totalEvents > 0 && (filters.search || filters.tags?.length || filters.venue_type || filters.dateRange)) {
      addToHistory(filters, totalEvents);
    }
  }, [totalEvents, filters, addToHistory]);

  const handleClearFilter = (filterType: string, value?: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      switch (filterType) {
        case 'search':
          delete newFilters.search;
          break;
        case 'tag':
          if (value && newFilters.tags) {
            newFilters.tags = newFilters.tags.filter(tag => tag !== value);
            if (newFilters.tags.length === 0) {
              delete newFilters.tags;
            }
          }
          break;
        case 'venue_type':
          delete newFilters.venue_type;
          break;
        case 'dateRange':
          delete newFilters.dateRange;
          break;
      }
      
      return newFilters;
    });
  };

  const handleClearAllFilters = () => {
    setFilters({
      sort_by: 'start_datetime',
      order: 'asc'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">
          エラーが発生しました。再度お試しください。
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ページ説明 */}
      <div className="mb-6 text-center">
        <p className="text-gray-600 text-lg">
          日本全国のイベントをカウントダウンでチェック！
        </p>
      </div>

      {/* 検索結果サマリー */}
      <SearchResultSummary
        totalResults={totalEvents}
        searchTerm={filters.search}
        appliedFilters={{
          tags: filters.tags,
          venue_type: filters.venue_type,
          dateRange: filters.dateRange
        }}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* イベント時間軸タブ */}
      {allEvents.length > 0 ? (
        <EventTimeTabs 
          events={allEvents} 
          searchTerm={filters.search}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {(filters.search || filters.tags?.length || filters.venue_type || filters.dateRange) 
              ? 'イベントが見つかりません' 
              : 'イベントが登録されていません'
            }
          </h3>
          <p className="text-gray-600">
            {(filters.search || filters.tags?.length || filters.venue_type || filters.dateRange)
              ? '検索条件を変更してお試しください。'
              : '新しいイベントが追加されるまでお待ちください。'
            }
          </p>
          {(filters.search || filters.tags?.length || filters.venue_type || filters.dateRange) && (
            <button
              onClick={handleClearAllFilters}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              すべての検索条件をクリア
            </button>
          )}
        </div>
      )}

      {/* 高度検索パネル */}
      <AdvancedSearchPanel
        isOpen={showAdvancedPanel}
        onClose={() => {
          setShowAdvancedPanel(false);
          onAdvancedSearchClose?.();
        }}
        onSearch={handleAdvancedSearch}
        initialFilters={filters}
      />

      {/* 検索履歴パネル */}
      <SearchHistoryPanel
        isOpen={showHistoryPanel}
        onClose={() => {
          setShowHistoryPanel(false);
          onSearchHistoryClose?.();
        }}
        onSelectSearch={handleHistorySearch}
      />
    </div>
  );
};