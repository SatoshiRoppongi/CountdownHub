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
  const totalSeconds = Math.floor((startTime.getTime() - Date.now()) / 1000);
  const urgencyLevel = getUrgencyLevel(totalSeconds);
  const { showEventStarted } = useToast();
  
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
      
      {/* Favorite Button - Top Right */}
      <div className="absolute top-4 right-4 z-10">
        <FavoriteButton 
          eventId={event.id} 
          size="small"
          className="backdrop-blur-sm"
        />
      </div>
      
      {/* Countdown Timer - Top Overlay */}
      <div className="absolute top-4 left-4 right-16">
        <div className={`
          backdrop-blur-md rounded-lg p-3 shadow-lg
          ${urgencyLevel === 'critical' ? 'bg-red-500/90' : ''}
          ${urgencyLevel === 'urgent' ? 'bg-orange-500/90' : ''}
          ${urgencyLevel === 'warning' ? 'bg-yellow-500/90' : ''}
          ${urgencyLevel === 'normal' ? 'bg-blue-500/90' : ''}
        `}>
          <CountdownTimer 
            targetDate={event.start_datetime} 
            size="large"
            textColor="white"
            onFinish={handleEventFinish}
          />
        </div>
      </div>

      {/* Bottom Overlay with Event Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4">
          {/* Event Title */}
          <h3 className="font-bold text-xl text-white mb-3 line-clamp-2">
            <SearchHighlight 
              text={event.title} 
              searchTerm={searchTerm}
            />
          </h3>
          
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
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-medium">{event._count.favorites || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};