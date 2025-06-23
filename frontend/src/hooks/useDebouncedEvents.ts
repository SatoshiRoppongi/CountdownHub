import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { eventAPI } from '../services/api';
import { EventsResponse, EventFilters } from '../types';

interface DebouncedEventsOptions {
  filters: EventFilters & { page?: number; limit?: number };
  debounceMs?: number;
}

export const useDebouncedEvents = ({ filters, debounceMs = 500 }: DebouncedEventsOptions) => {
  const [debouncedFilters, setDebouncedFilters] = useState(filters);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // デバウンス処理
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, debounceMs]);

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
    staleTime: 5000,
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