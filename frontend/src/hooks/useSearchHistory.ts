import { useState, useEffect } from 'react';
import { EventFilters } from '../types';

interface SearchHistoryItem {
  id: string;
  query: string;
  filters: EventFilters;
  timestamp: number;
  resultCount?: number;
}

interface SavedSearch extends SearchHistoryItem {
  name: string;
  isSaved: true;
}

const SEARCH_HISTORY_KEY = 'countdown_hub_search_history';
const SAVED_SEARCHES_KEY = 'countdown_hub_saved_searches';
const MAX_HISTORY_ITEMS = 20;

export const useSearchHistory = () => {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  // LocalStorageから履歴を読み込み
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(SEARCH_HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }

      const savedSearchesData = localStorage.getItem(SAVED_SEARCHES_KEY);
      if (savedSearchesData) {
        setSavedSearches(JSON.parse(savedSearchesData));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // 履歴をLocalStorageに保存
  const saveHistoryToStorage = (newHistory: SearchHistoryItem[]) => {
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  // 保存された検索をLocalStorageに保存
  const saveSavedSearchesToStorage = (newSavedSearches: SavedSearch[]) => {
    try {
      localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(newSavedSearches));
    } catch (error) {
      console.error('Failed to save saved searches:', error);
    }
  };

  // 検索履歴に追加
  const addToHistory = (filters: EventFilters, resultCount?: number) => {
    const query = createSearchQuery(filters);
    if (!query) return; // 空の検索は履歴に追加しない

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query,
      filters,
      timestamp: Date.now(),
      resultCount
    };

    setHistory(prev => {
      // 同じクエリが既に存在する場合は削除してから追加（最新に移動）
      const filtered = prev.filter(item => item.query !== query);
      const newHistory = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistoryToStorage(newHistory);
      return newHistory;
    });
  };

  // 検索を保存
  const saveSearch = (filters: EventFilters, name: string, resultCount?: number) => {
    const query = createSearchQuery(filters);
    if (!query || !name.trim()) return false;

    const savedSearch: SavedSearch = {
      id: Date.now().toString(),
      name: name.trim(),
      query,
      filters,
      timestamp: Date.now(),
      resultCount,
      isSaved: true
    };

    setSavedSearches(prev => {
      const newSavedSearches = [savedSearch, ...prev];
      saveSavedSearchesToStorage(newSavedSearches);
      return newSavedSearches;
    });

    return true;
  };

  // 保存された検索を削除
  const deleteSavedSearch = (id: string) => {
    setSavedSearches(prev => {
      const filtered = prev.filter(item => item.id !== id);
      saveSavedSearchesToStorage(filtered);
      return filtered;
    });
  };

  // 履歴項目を削除
  const deleteHistoryItem = (id: string) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.id !== id);
      saveHistoryToStorage(filtered);
      return filtered;
    });
  };

  // 履歴を全てクリア
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  // 検索クエリ文字列を生成
  const createSearchQuery = (filters: EventFilters): string => {
    const parts: string[] = [];

    if (filters.search?.trim()) {
      parts.push(`"${filters.search.trim()}"`);
    }

    if (filters.tags?.length) {
      parts.push(`タグ:${filters.tags.join(',')}`);
    }

    if (filters.venue_type) {
      const venueTypeLabels = {
        online: 'オンライン',
        offline: 'オフライン',
        hybrid: 'ハイブリッド'
      };
      parts.push(`形式:${venueTypeLabels[filters.venue_type]}`);
    }

    if (filters.dateRange) {
      const { start_date, end_date } = filters.dateRange;
      if (start_date || end_date) {
        const startStr = start_date ? new Date(start_date).toLocaleDateString('ja-JP') : '開始日未設定';
        const endStr = end_date ? new Date(end_date).toLocaleDateString('ja-JP') : '終了日未設定';
        parts.push(`期間:${startStr}〜${endStr}`);
      }
    }

    return parts.join(' ');
  };

  // 人気検索キーワードを取得
  const getPopularSearchTerms = (): string[] => {
    const searchTerms: { [key: string]: number } = {};
    
    [...history, ...savedSearches].forEach(item => {
      if (item.filters.search?.trim()) {
        const term = item.filters.search.trim().toLowerCase();
        searchTerms[term] = (searchTerms[term] || 0) + 1;
      }
    });

    return Object.entries(searchTerms)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
  };

  // 人気タグを取得
  const getPopularTags = (): string[] => {
    const tagCounts: { [key: string]: number } = {};
    
    [...history, ...savedSearches].forEach(item => {
      item.filters.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15)
      .map(([tag]) => tag);
  };

  return {
    history,
    savedSearches,
    addToHistory,
    saveSearch,
    deleteSavedSearch,
    deleteHistoryItem,
    clearHistory,
    getPopularSearchTerms,
    getPopularTags
  };
};