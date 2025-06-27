import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useEvents } from '../hooks/useEvents';
import { EventTimeTabsWithPagination } from '../components/EventTimeTabsWithPagination';
import { AdvancedSearchPanel } from '../components/AdvancedSearchPanel';
import { SearchResultSummary } from '../components/SearchHighlight';
import { EventFilters, SortOption } from '../types';

interface EventListPageProps {
  searchQuery?: string;
  showAdvancedSearch?: boolean;
  onAdvancedSearchClose?: () => void;
}

export const EventListPage: React.FC<EventListPageProps> = ({ 
  searchQuery,
  showAdvancedSearch,
  onAdvancedSearchClose
}) => {
  const [filters, setFilters] = useState<EventFilters>({
    sort_by: 'start_datetime',
    order: 'asc'
  });
  const [currentSort, setCurrentSort] = useState<SortOption>('start_datetime_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTimeCategory, setActiveTimeCategory] = useState<'today' | 'upcoming' | 'ongoing' | 'ended'>('today');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState(false);
  const [initialTabSet, setInitialTabSet] = useState(false);
  
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

  // 検索実行時にパネルを自動で閉じる
  useEffect(() => {
    if (filters.search !== undefined) {
      setShowAdvancedPanel(false);
      onAdvancedSearchClose?.();
    }
  }, [filters.search, onAdvancedSearchClose]);

  const handleAdvancedSearch = (newFilters: EventFilters) => {
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

  // 当日イベント数を取得（初期タブ決定用）
  const { data: todayEventsData } = useEvents({ 
    timeCategory: 'today',
    sort_by: 'start_datetime',
    order: 'asc',
    page: 1,
    limit: 1
  });

  const { 
    data, 
    isLoading, 
    error
  } = useEvents({ 
    ...filters, 
    page: currentPage, 
    limit: itemsPerPage 
  });

  // 初期タブ設定（当日イベントがない場合は「今後開催」に変更）
  useEffect(() => {
    if (!initialTabSet && todayEventsData) {
      const todayEventCount = todayEventsData.pagination?.total || 0;
      if (todayEventCount === 0) {
        setActiveTimeCategory('upcoming');
      }
      setInitialTabSet(true);
    }
  }, [todayEventsData, initialTabSet]);

  const events = data?.events || [];
  const totalEvents = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;


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

  // appliedFiltersオブジェクトをメモ化（無限レンダリング防止）
  const appliedFilters = useMemo(() => ({
    tags: filters.tags,
    venue_type: filters.venue_type,
    dateRange: filters.dateRange
  }), [filters.tags, filters.venue_type, filters.dateRange]);

  // コールバック関数をメモ化（無限レンダリング防止）
  const handleAdvancedSearchClose = useCallback(() => {
    setShowAdvancedPanel(false);
    onAdvancedSearchClose?.();
  }, [onAdvancedSearchClose]);

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
        appliedFilters={appliedFilters}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAllFilters}
      />

      {/* イベントタブ（ページネーション付き） */}
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

      {/* 高度検索パネル */}
      <AdvancedSearchPanel
        isOpen={showAdvancedPanel}
        onClose={handleAdvancedSearchClose}
        onSearch={handleAdvancedSearch}
        initialFilters={filters}
      />

    </div>
  );
};