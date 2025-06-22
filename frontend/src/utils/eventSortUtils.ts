import { Event, SortOption } from '../types';

export function sortEvents(events: Event[], sortOption: SortOption): Event[] {
  const sortedEvents = [...events];

  switch (sortOption) {
    case 'start_datetime_asc':
      return sortedEvents.sort((a, b) => 
        new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()
      );
    
    case 'start_datetime_desc':
      return sortedEvents.sort((a, b) => 
        new Date(b.start_datetime).getTime() - new Date(a.start_datetime).getTime()
      );
    
    case 'created_at_asc':
      return sortedEvents.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    
    case 'created_at_desc':
      return sortedEvents.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    case 'comments_desc':
      return sortedEvents.sort((a, b) => 
        (b._count.comments || 0) - (a._count.comments || 0)
      );
    
    case 'favorites_desc':
      return sortedEvents.sort((a, b) => 
        (b._count.favorites || 0) - (a._count.favorites || 0)
      );
    
    default:
      return sortedEvents;
  }
}

export function convertSortOptionToApiParams(sortOption: SortOption): { sort_by: string; order: string } {
  switch (sortOption) {
    case 'start_datetime_asc':
      return { sort_by: 'start_datetime', order: 'asc' };
    case 'start_datetime_desc':
      return { sort_by: 'start_datetime', order: 'desc' };
    case 'created_at_asc':
      return { sort_by: 'created_at', order: 'asc' };
    case 'created_at_desc':
      return { sort_by: 'created_at', order: 'desc' };
    case 'comments_desc':
      return { sort_by: 'comments', order: 'desc' };
    case 'favorites_desc':
      return { sort_by: 'favorites', order: 'desc' };
    default:
      return { sort_by: 'start_datetime', order: 'asc' };
  }
}