import { useInfiniteQuery } from '@tanstack/react-query';
import { eventAPI } from '../services/api';
import { EventFilters, EventsResponse } from '../types';

interface UseInfiniteEventsOptions extends EventFilters {
  limit?: number;
}

export const useInfiniteEvents = (options: UseInfiniteEventsOptions = {}) => {
  const { limit = 20, ...filters } = options;

  return useInfiniteQuery<EventsResponse, Error>({
    queryKey: ['infinite-events', filters],
    queryFn: ({ pageParam = 1 }) => 
      eventAPI.getEvents({ ...filters, page: pageParam as number, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.page < pagination.totalPages 
        ? pagination.page + 1 
        : undefined;
    },
    select: (data) => ({
      pages: data.pages.map(page => ({
        ...page,
        events: page.events.map(event => ({
          ...event,
          start_datetime: new Date(event.start_datetime).toISOString(),
          end_datetime: event.end_datetime ? new Date(event.end_datetime).toISOString() : null,
        }))
      })),
      pageParams: data.pageParams,
    }),
  });
};