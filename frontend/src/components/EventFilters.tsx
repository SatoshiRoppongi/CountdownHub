import React, { useState, useEffect } from 'react';
import { EventFilters as FilterType } from '../types';

interface EventFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
}

export const EventFilters: React.FC<EventFiltersProps> = ({ filters, onFiltersChange }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // デバウンス機能付きの検索
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchTerm || undefined });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleVenueTypeChange = (venueType: 'online' | 'offline' | 'hybrid' | '') => {
    onFiltersChange({
      ...filters,
      venue_type: venueType || undefined,
    });
  };

  const handleSortChange = (sortBy: string, order: 'asc' | 'desc') => {
    onFiltersChange({
      ...filters,
      sort_by: sortBy as any,
      order,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    onFiltersChange({
      sort_by: 'start_datetime',
      order: 'asc',
    });
  };

  const hasActiveFilters = filters.search || filters.venue_type;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* 検索ボックス */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="イベントを検索..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ソートオプション */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="text-sm font-medium text-gray-700 self-center mr-2">並び順:</span>
        <button
          onClick={() => handleSortChange('start_datetime', 'asc')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.sort_by === 'start_datetime' && filters.order === 'asc'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          開催日順
        </button>
        <button
          onClick={() => handleSortChange('created_at', 'desc')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.sort_by === 'created_at' && filters.order === 'desc'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          新着順
        </button>
        <button
          onClick={() => handleSortChange('comments', 'desc')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.sort_by === 'comments' && filters.order === 'desc'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          コメント数順
        </button>
      </div>

      {/* 詳細フィルタトグル */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          詳細フィルタ
          <svg 
            className={`ml-1 h-4 w-4 transform transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center"
          >
            <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            フィルタをクリア
          </button>
        )}
      </div>

      {/* 詳細フィルタ */}
      {showAdvancedFilters && (
        <div className="border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 開催形式フィルタ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開催形式
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="venue_type"
                    value=""
                    checked={!filters.venue_type}
                    onChange={(e) => handleVenueTypeChange(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">すべて</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="venue_type"
                    value="online"
                    checked={filters.venue_type === 'online'}
                    onChange={(e) => handleVenueTypeChange(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">💻 オンライン</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="venue_type"
                    value="offline"
                    checked={filters.venue_type === 'offline'}
                    onChange={(e) => handleVenueTypeChange(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">🏢 オフライン</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="venue_type"
                    value="hybrid"
                    checked={filters.venue_type === 'hybrid'}
                    onChange={(e) => handleVenueTypeChange(e.target.value as any)}
                    className="mr-2"
                  />
                  <span className="text-sm">🔄 ハイブリッド</span>
                </label>
              </div>
            </div>

            {/* 将来的に他のフィルタを追加する場合はここに */}
            <div>
              {/* 予約スペース */}
            </div>
          </div>
        </div>
      )}

      {/* アクティブフィルタ表示 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-600">アクティブフィルタ:</span>
            {filters.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                検索: "{filters.search}"
              </span>
            )}
            {filters.venue_type && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {filters.venue_type === 'online' && '💻 オンライン'}
                {filters.venue_type === 'offline' && '🏢 オフライン'}
                {filters.venue_type === 'hybrid' && '🔄 ハイブリッド'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};