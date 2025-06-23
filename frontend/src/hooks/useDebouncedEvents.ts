import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventAPI } from '../services/api';
import { EventsResponse, EventFilters } from '../types';

interface DebouncedEventsOptions {
  filters: EventFilters & { page?: number; limit?: number };
  debounceMs?: number;
}

export const useDebouncedEvents = ({ filters, debounceMs = 300 }: DebouncedEventsOptions) => {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // デバウンス処理（検索文字のみデバウンス、その他は即座に反映）
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 検索文字以外の変更は即座に反映
    const { search, ...otherFilters } = filters;
    const { search: prevSearch, ...prevOtherFilters } = debouncedFilters;

    // 検索文字以外が変更された場合は即座に更新
    if (JSON.stringify(otherFilters) !== JSON.stringify(prevOtherFilters)) {
      setDebouncedFilters(filters);
      return;
    }

    // 検索文字が変更された場合のみデバウンス
    if (search !== prevSearch) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedFilters(filters);
      }, debounceMs);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, debounceMs, debouncedFilters]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // デバウンスされたfiltersを使ってクエリを実行
  return useQuery<EventsResponse>({
    queryKey: ['events', debouncedFilters],
    queryFn: () => eventAPI.getEvents(debouncedFilters),
    staleTime: 1000, // 1秒に短縮して検索結果をより迅速に反映
    refetchOnWindowFocus: false,
    select: (data) => ({
      ...data,
      events: data.events.map(event => ({
        ...event,
        start_datetime: new Date(event.start_datetime).toISOString(),
        end_datetime: event.end_datetime ? new Date(event.end_datetime).toISOString() : null,
      }))
    }),
  });
};