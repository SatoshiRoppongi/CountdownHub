import React, { useState } from 'react';
import { SortOption } from '../types';

interface EventSortBarProps {
  currentSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
}

export const EventSortBar: React.FC<EventSortBarProps> = ({
  currentSort,
  onSortChange,
  totalCount
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const sortOptions: { value: SortOption; label: string; icon: string }[] = [
    { value: 'start_datetime_asc', label: '開催日時が早い順', icon: '📅⬆️' },
    { value: 'start_datetime_desc', label: '開催日時が新しい順', icon: '📅⬇️' },
    { value: 'created_at_desc', label: '投稿が新しい順', icon: '🆕' },
    { value: 'created_at_asc', label: '投稿が古い順', icon: '📰' },
    { value: 'comments_desc', label: 'コメントが多い順', icon: '💬' },
    { value: 'favorites_desc', label: 'お気に入りが多い順', icon: '❤️' },
  ];

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === currentSort);
    return option ? `${option.icon} ${option.label}` : '並び順を選択';
  };

  const handleSortSelect = (sort: SortOption) => {
    onSortChange(sort);
    setIsDropdownOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 sm:p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        {/* 件数表示 */}
        <div className="text-xs sm:text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>件のイベント
        </div>

        {/* ソートドロップダウン */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors w-full sm:w-auto justify-between sm:justify-start"
          >
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0">
              <span className="hidden lg:inline text-xs sm:text-sm">並び順:</span>
              <span className="text-blue-600 truncate text-xs sm:text-sm">{getCurrentSortLabel()}</span>
            </div>
            <svg 
              className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform flex-shrink-0 ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* ドロップダウンメニュー */}
          {isDropdownOpen && (
            <div className="absolute left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={`
                      w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm transition-colors
                      ${currentSort === option.value 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-sm">{option.icon}</span>
                      <span className="truncate">{option.label}</span>
                    </span>
                    {currentSort === option.value && (
                      <svg className="inline w-3 h-3 sm:w-4 sm:h-4 ml-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* クリックでドロップダウンを閉じるためのオーバーレイ */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};