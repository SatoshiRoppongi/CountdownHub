import React from 'react';
import { Event } from '../types';
import { EventCard } from './EventCard';

interface EventGridProps {
  events: Event[];
  searchTerm?: string;
  isLoading?: boolean;
}

export const EventGrid: React.FC<EventGridProps> = ({ 
  events, 
  searchTerm, 
  isLoading = false 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow-md">
        <div className="text-6xl mb-4">📅</div>
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          イベントが見つかりません
        </h3>
        <p className="text-gray-600">
          条件に一致するイベントがありません。検索条件を変更してお試しください。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {events.map((event) => (
        <EventCard 
          key={event.id} 
          event={event} 
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
};