import React, { useState, useEffect } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventTimeTabsWithPagination } from '../components/EventTimeTabsWithPagination';
import { AdvancedSearchPanel } from '../components/AdvancedSearchPanel';
import { SearchHistoryPanel } from '../components/SearchHistoryPanel';
import { SearchResultSummary } from '../components/SearchHighlight';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { EventFilters, SortOption } from '../types';

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
  const [currentSort, setCurrentSort] = useState<SortOption>('start_datetime_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTimeCategory, setActiveTimeCategory] = useState<'today' | 'upcoming' | 'ongoing' | 'ended'>('today');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const { addToHistory } = useSearchHistory();
  
  const itemsPerPage = 30;
  
  // ヘッダーからの検索クエリを反映
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery || undefined
    }));
    setCurrentPage(1); // 検索時はページをリセット
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
    setCurrentPage(1); // フィルター変更時はページをリセット
  };

  const handleHistorySearch = (newFilters: EventFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // フィルター変更時はページをリセット
  };

  // ソート設定とtimeCategoryをフィルターに反映
  useEffect(() => {
    const parts = currentSort.split('_');
    const order = parts.pop() as 'asc' | 'desc';
    const sort_by = parts.join('_') as 'start_datetime' | 'created_at' | 'comments' | 'favorites';
    setFilters(prev => ({ ...prev, sort_by, order, timeCategory: activeTimeCategory }));
  }, [currentSort, activeTimeCategory]);

  const { 
    data, 
    isLoading, 
    error
  } = useEvents({ 
    ...filters, 
    page: currentPage, 
    limit: itemsPerPage 
  });

  const events = data?.events || [];
  const totalEvents = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;

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
    setCurrentPage(1); // フィルター変更時はページをリセット
  };

  const handleClearAllFilters = () => {
    setFilters({
      sort_by: 'start_datetime',
      order: 'asc'
    });
    setCurrentPage(1); // フィルター変更時はページをリセット
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sort: SortOption) => {
    setCurrentSort(sort);
    setCurrentPage(1); // ソート変更時はページをリセット
  };

  const handleTimeCategoryChange = (category: 'today' | 'upcoming' | 'ongoing' | 'ended') => {
    setActiveTimeCategory(category);
    setCurrentPage(1); // タブ変更時はページをリセット
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 text-center">
          <p className="text-gray-600 text-lg">
            日本全国のイベントをカウントダウンでチェック！
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(30)].map((_, i) => (
            <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
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

      {/* イベントタブ（ページネーション付き） */}
      {events.length > 0 ? (
        <EventTimeTabsWithPagination
          events={events}
          searchTerm={filters.search}
          totalEvents={totalEvents}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          currentSort={currentSort}
          activeTimeCategory={activeTimeCategory}
          onTimeCategoryChange={handleTimeCategoryChange}
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