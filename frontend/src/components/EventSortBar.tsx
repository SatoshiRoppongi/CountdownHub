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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* 件数表示 */}
        <div className="text-sm text-gray-600">
          <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>件のイベント
        </div>

        {/* ソートドロップダウン */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <span>並び順:</span>
            <span className="text-blue-600">{getCurrentSortLabel()}</span>
            <svg 
              className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* ドロップダウンメニュー */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="py-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSortSelect(option.value)}
                    className={`
                      w-full text-left px-4 py-2 text-sm transition-colors
                      ${currentSort === option.value 
                        ? 'bg-blue-50 text-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{option.icon}</span>
                      <span>{option.label}</span>
                    </span>
                    {currentSort === option.value && (
                      <svg className="inline w-4 h-4 ml-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
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