import React, { useState, useEffect, useMemo } from 'react';
import { Event, SortOption } from '../types';
import { EventCard } from './EventCard';
import { EventSortBar } from './EventSortBar';
import { 
  categorizeEventsByTime, 
  EventTimeCategory, 
  getEventTimeCategoryLabel,
  getEventTimeCategoryDescription 
} from '../utils/eventTimeUtils';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';

interface EventTimeTabsProps {
  events: Event[];
  searchTerm?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const EventTimeTabs: React.FC<EventTimeTabsProps> = ({ 
  events, 
  searchTerm, 
  hasNextPage = false,
  isFetchingNextPage = false,
  onLoadMore 
}) => {
  const [activeTab, setActiveTab] = useState<EventTimeCategory>('today');
  const [sortOption, setSortOption] = useState<SortOption>('start_datetime_asc');
  
  // タブごとのデフォルトソート
  const getDefaultSort = (tab: EventTimeCategory): SortOption => {
    switch (tab) {
      case 'ended':
        return 'start_datetime_desc'; // 終了済みは終了が新しい順（最近終了したものから）
      default:
        return 'start_datetime_asc'; // その他は開催日時昇順
    }
  };

  // タブ変更時にデフォルトソートに戻す
  const handleTabChange = (tab: EventTimeCategory) => {
    setActiveTab(tab);
    setSortOption(getDefaultSort(tab));
  };
  
  const categorizedEvents = useMemo(() => 
    categorizeEventsByTime(events, sortOption), 
    [events, sortOption]
  );
  
  // 無限スクロール用のIntersection Observer
  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
    enabled: hasNextPage && !isFetchingNextPage
  });

  // スクロール位置に到達したら次のページを読み込み
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage && onLoadMore) {
      onLoadMore();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, onLoadMore]);

  const tabs: EventTimeCategory[] = ['today', 'upcoming', 'ongoing', 'ended'];

  const getTabCount = (category: EventTimeCategory): number => {
    return categorizedEvents[category].length;
  };

  const getTabStyle = (category: EventTimeCategory): string => {
    const baseStyle = "relative px-3 sm:px-6 py-3 font-medium text-xs sm:text-sm transition-all duration-200 flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 border-b-2 min-w-0 flex-1 justify-center";
    
    if (activeTab === category) {
      switch (category) {
        case 'today':
          return `${baseStyle} text-red-600 border-red-500 bg-red-50`;
        case 'upcoming':
          return `${baseStyle} text-blue-600 border-blue-500 bg-blue-50`;
        case 'ongoing':
          return `${baseStyle} text-green-600 border-green-500 bg-green-50`;
        case 'ended':
          return `${baseStyle} text-gray-600 border-gray-500 bg-gray-50`;
      }
    }
    
    return `${baseStyle} text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300`;
  };

  const activeEvents = categorizedEvents[activeTab];

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          {tabs.map(category => (
            <button
              key={category}
              onClick={() => handleTabChange(category)}
              className={getTabStyle(category)}
            >
              <span className="truncate text-center leading-tight">{getEventTimeCategoryLabel(category)}</span>
              <span className={`
                px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-bold min-w-[18px] sm:min-w-[20px] h-4 sm:h-5 flex items-center justify-center
                ${activeTab === category 
                  ? 'bg-white text-current shadow-sm' 
                  : 'bg-gray-100 text-gray-600'
                }
              `}>
                {getTabCount(category)}
              </span>
            </button>
          ))}
        </div>
        
        {/* アクティブタブの説明 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-gray-600 text-sm">
            {getEventTimeCategoryDescription(activeTab)}
          </div>
        </div>
      </div>

      {/* ソートバー */}
      <EventSortBar
        currentSort={sortOption}
        onSortChange={setSortOption}
        totalCount={activeEvents.length}
      />

      {/* イベント一覧 */}
      {activeEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeEvents.map(event => (
            <EventCard key={event.id} event={event} searchTerm={searchTerm} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">
            {activeTab === 'today' && '⏰'}
            {activeTab === 'upcoming' && '📅'}
            {activeTab === 'ongoing' && '🔴'}
            {activeTab === 'ended' && '✅'}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {activeTab === 'today' && '当日開催のイベントはありません'}
            {activeTab === 'upcoming' && '今後開催予定のイベントはありません'}
            {activeTab === 'ongoing' && '現在開催中のイベントはありません'}
            {activeTab === 'ended' && '終了したイベントはありません'}
          </h3>
          <p className="text-gray-600">
            {activeTab === 'today' && '新しいイベントが追加されるまでお待ちください。'}
            {activeTab === 'upcoming' && '新しいイベントが登録されるまでお待ちください。'}
            {activeTab === 'ongoing' && 'ライブイベントが開始されるまでお待ちください。'}
            {activeTab === 'ended' && '過去のイベントが表示されます。'}
          </p>
        </div>
      )}
      
      {/* 無限ローディング */}
      {hasNextPage && (
        <div ref={loadMoreRef} className="flex justify-center py-8">
          {isFetchingNextPage ? (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium">読み込み中...</span>
            </div>
          ) : (
            <div className="text-gray-500 text-sm">
              さらに読み込むにはスクロールしてください
            </div>
          )}
        </div>
      )}
      
      {!hasNextPage && activeEvents.length > 0 && (
        <div className="text-center py-4">
          <div className="text-gray-500 text-sm">
            すべてのイベントを表示しました
          </div>
        </div>
      )}
    </div>
  );
};