import React from 'react';
import { Link } from 'react-router-dom';
import { Event } from '../types';
import { CountdownTimer } from './CountdownTimer';
import { SearchHighlight } from './SearchHighlight';
import { FavoriteButton } from './FavoriteButton';
import { getUrgencyLevel } from '../hooks/useCountdown';
import { useToast } from '../contexts/ToastContext';

interface EventCardProps {
  event: Event;
  searchTerm?: string;
}

export const EventCard: React.FC<EventCardProps> = ({ event, searchTerm }) => {
  const startTime = new Date(event.start_datetime);
  const endTime = event.end_datetime ? new Date(event.end_datetime) : null;
  const now = new Date();
  const totalSeconds = Math.floor((startTime.getTime() - now.getTime()) / 1000);
  const urgencyLevel = getUrgencyLevel(totalSeconds);
  const { showEventStarted } = useToast();

  // イベントの状態を判定
  const isStarted = now >= startTime;
  const isRunning = endTime ? (now >= startTime && now < endTime) : false;
  const isEnded = endTime ? now >= endTime : isStarted;
  
  const backgroundImage = event.image_url || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=500&h=300&fit=crop';

  const handleEventFinish = () => {
    showEventStarted(event.title);
  };

  return (
    <div className="relative h-80 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-gray-400 transition-transform duration-300 group-hover:scale-105"
        style={{
          backgroundImage: `url(${backgroundImage})`,
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
      
      {/* Clickable Link Area */}
      <Link to={`/events/${event.id}`} className="absolute inset-0 cursor-pointer" />
      
      
      {/* Countdown Timer - Top Overlay */}
      <div className="absolute top-4 left-4 right-4 pointer-events-none">
        <div className={`
          backdrop-blur-md rounded-lg p-3 shadow-lg
          ${isEnded && !isRunning ? 'bg-gray-500/90' : ''}
          ${isRunning ? 'bg-green-500/90' : ''}
          ${!isStarted && urgencyLevel === 'critical' ? 'bg-red-500/90' : ''}
          ${!isStarted && urgencyLevel === 'urgent' ? 'bg-orange-500/90' : ''}
          ${!isStarted && urgencyLevel === 'warning' ? 'bg-yellow-500/90' : ''}
          ${!isStarted && urgencyLevel === 'normal' ? 'bg-blue-500/90' : ''}
        `}>
          <CountdownTimer 
            targetDate={event.start_datetime}
            endDate={event.end_datetime || undefined}
            size="large"
            textColor="white"
            onFinish={handleEventFinish}
          />
        </div>
      </div>

      {/* Bottom Overlay with Event Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
          {/* Event Title with Favorite Button */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold text-xl text-white line-clamp-2 flex-1 mr-2">
              <SearchHighlight 
                text={event.title} 
                searchTerm={searchTerm}
              />
            </h3>
            <div className="flex-shrink-0 pointer-events-auto">
              <FavoriteButton 
                eventId={event.id} 
                size="small"
                className="backdrop-blur-sm"
              />
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-white/90">
            {/* Comments */}
            <div className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">{event._count.comments}</span>
            </div>
            
            {/* Favorites */}
            <div className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span className="text-sm font-medium">{event._count.favorites || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};