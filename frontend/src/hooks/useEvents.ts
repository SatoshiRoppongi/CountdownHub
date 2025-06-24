import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventAPI } from '../services/api';
import { Event, EventsResponse, EventFilters } from '../types';

export const useEvents = (filters: EventFilters & { page?: number; limit?: number } = {}) => {
  return useQuery<EventsResponse>({
    queryKey: ['events', filters],
    queryFn: () => eventAPI.getEvents(filters),
    staleTime: 30000, // 30秒間はキャッシュデータを使用
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動リフェッチを無効
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

export const useEvent = (id: number) => {
  return useQuery<Event>({
    queryKey: ['event', id],
    queryFn: () => eventAPI.getEventById(id),
    enabled: !!id,
    select: (data) => ({
      ...data,
      start_datetime: new Date(data.start_datetime).toISOString(),
      end_datetime: data.end_datetime ? new Date(data.end_datetime).toISOString() : null,
    }),
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (eventData: Partial<Event>) => eventAPI.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) => 
      eventAPI.updateEvent(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => eventAPI.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
};