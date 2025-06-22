import React, { useState, useEffect, useMemo } from 'react';
import { Event } from '../types';
import { EventCard } from './EventCard';
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
  const categorizedEvents = useMemo(() => categorizeEventsByTime(events), [events]);
  
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
    const baseStyle = "px-6 py-3 font-medium text-sm rounded-lg transition-all duration-200 flex items-center space-x-2";
    
    if (activeTab === category) {
      switch (category) {
        case 'today':
          return `${baseStyle} bg-red-500 text-white shadow-lg`;
        case 'upcoming':
          return `${baseStyle} bg-blue-500 text-white shadow-lg`;
        case 'ongoing':
          return `${baseStyle} bg-green-500 text-white shadow-lg`;
        case 'ended':
          return `${baseStyle} bg-gray-500 text-white shadow-lg`;
      }
    }
    
    return `${baseStyle} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`;
  };

  const activeEvents = categorizedEvents[activeTab];

  return (
    <div className="space-y-6">
      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {tabs.map(category => (
            <button
              key={category}
              onClick={() => setActiveTab(category)}
              className={getTabStyle(category)}
            >
              <span>{getEventTimeCategoryLabel(category)}</span>
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-bold">
                {getTabCount(category)}
              </span>
            </button>
          ))}
        </div>
        
        {/* アクティブタブの説明 */}
        <div className="text-gray-600 text-sm">
          {getEventTimeCategoryDescription(activeTab)}
        </div>
      </div>

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