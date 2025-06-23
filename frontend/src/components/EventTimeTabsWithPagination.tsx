import React from 'react';
import { Event, SortOption } from '../types';
import { EventCard } from './EventCard';
import { EventSortBar } from './EventSortBar';
import { Pagination } from './Pagination';
import { 
  EventTimeCategory, 
  getEventTimeCategoryLabel,
  getEventTimeCategoryDescription 
} from '../utils/eventTimeUtils';

interface EventTimeTabsWithPaginationProps {
  events: Event[];
  searchTerm?: string;
  totalEvents: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onSortChange: (sort: SortOption) => void;
  currentSort: SortOption;
  activeTimeCategory: 'today' | 'upcoming' | 'ongoing' | 'ended';
  onTimeCategoryChange: (category: 'today' | 'upcoming' | 'ongoing' | 'ended') => void;
}

export const EventTimeTabsWithPagination: React.FC<EventTimeTabsWithPaginationProps> = ({ 
  events, 
  searchTerm,
  totalEvents,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onSortChange,
  currentSort,
  activeTimeCategory,
  onTimeCategoryChange
}) => {
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
    onTimeCategoryChange(tab);
    const defaultSort = getDefaultSort(tab);
    onSortChange(defaultSort);
    onPageChange(1); // ページもリセット
  };
  
  const tabs: EventTimeCategory[] = ['today', 'upcoming', 'ongoing', 'ended'];

  const getTabStyle = (category: EventTimeCategory): string => {
    const baseStyle = "relative px-1 sm:px-3 lg:px-6 py-2 sm:py-3 font-medium text-xs sm:text-sm transition-all duration-200 flex flex-col sm:flex-row items-center space-y-0.5 sm:space-y-0 sm:space-x-2 border-b-2 min-w-0 flex-1 justify-center";
    
    if (activeTimeCategory === category) {
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
              <span className="truncate text-center leading-tight text-xs sm:text-sm">{getEventTimeCategoryLabel(category)}</span>
            </button>
          ))}
        </div>
        
        {/* アクティブタブの説明 */}
        <div className="p-4 bg-gray-50 border-t">
          <div className="text-gray-600 text-sm">
            {getEventTimeCategoryDescription(activeTimeCategory)}
          </div>
        </div>
      </div>

      {/* ソートバー */}
      <EventSortBar
        currentSort={currentSort}
        onSortChange={(sort) => {
          onSortChange(sort);
          onPageChange(1); // ソート変更時はページをリセット
        }}
        totalCount={totalEvents}
      />

      {/* イベント一覧 */}
      {events.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <EventCard key={event.id} event={event} searchTerm={searchTerm} />
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                totalItems={totalEvents}
                itemsPerPage={itemsPerPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">
            {activeTimeCategory === 'today' && '⏰'}
            {activeTimeCategory === 'upcoming' && '📅'}
            {activeTimeCategory === 'ongoing' && '🔴'}
            {activeTimeCategory === 'ended' && '✅'}
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            {activeTimeCategory === 'today' && '当日開催のイベントはありません'}
            {activeTimeCategory === 'upcoming' && '今後開催予定のイベントはありません'}
            {activeTimeCategory === 'ongoing' && '現在開催中のイベントはありません'}
            {activeTimeCategory === 'ended' && '終了したイベントはありません'}
          </h3>
          <p className="text-gray-600">
            {activeTimeCategory === 'today' && '新しいイベントが追加されるまでお待ちください。'}
            {activeTimeCategory === 'upcoming' && '新しいイベントが登録されるまでお待ちください。'}
            {activeTimeCategory === 'ongoing' && 'ライブイベントが開始されるまでお待ちください。'}
            {activeTimeCategory === 'ended' && '過去のイベントが表示されます。'}
          </p>
        </div>
      )}
    </div>
  );
};