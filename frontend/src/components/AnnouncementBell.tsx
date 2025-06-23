import React, { useState } from 'react';
import { useActiveAnnouncements } from '../hooks/useAnnouncements';
import { Announcement, AnnouncementType, AnnouncementPriority } from '../types';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, announcements }) => {
  if (!isOpen) return null;

  const getTypeIcon = (type: AnnouncementType): string => {
    switch (type) {
      case 'info': return 'ℹ️';
      case 'maintenance': return '🔧';
      case 'feature': return '✨';
      case 'warning': return '⚠️';
      case 'emergency': return '🚨';
      default: return 'ℹ️';
    }
  };

  const getTypeLabel = (type: AnnouncementType): string => {
    switch (type) {
      case 'info': return '情報';
      case 'maintenance': return 'メンテナンス';
      case 'feature': return '新機能';
      case 'warning': return '警告';
      case 'emergency': return '緊急';
      default: return '情報';
    }
  };

  const getPriorityColor = (priority: AnnouncementPriority): string => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="text-2xl mr-2">📢</span>
            お知らせ
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {announcements.length > 0 ? (
            <div className="p-6 space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(announcement.priority)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(announcement.type)}</span>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white bg-opacity-70">
                        {getTypeLabel(announcement.type)}
                      </span>
                      {announcement.priority === 'urgent' && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-600 text-white">
                          緊急
                        </span>
                      )}
                      {announcement.priority === 'high' && (
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-orange-600 text-white">
                          重要
                        </span>
                      )}
                    </div>
                    <time className="text-xs opacity-75">
                      {formatDate(announcement.created_at)}
                    </time>
                  </div>

                  <h3 className="font-bold text-lg mb-2">{announcement.title}</h3>
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {announcement.content}
                  </div>

                  {(announcement.start_date || announcement.end_date) && (
                    <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                      <div className="text-xs space-y-1">
                        {announcement.start_date && (
                          <div>📅 開始: {formatDate(announcement.start_date)}</div>
                        )}
                        {announcement.end_date && (
                          <div>📅 終了: {formatDate(announcement.end_date)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📢</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                お知らせはありません
              </h3>
              <p className="text-gray-600">
                現在表示できるお知らせはありません。
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export const AnnouncementBell: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading } = useActiveAnnouncements();

  const announcements = data?.announcements || [];
  const unreadCount = announcements.length;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        title="お知らせを表示"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-3.5-3.5v-2a6.5 6.5 0 10-13 0v2L1 17h5a4 4 0 008 0zm0 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isLoading && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          </div>
        )}
      </button>

      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        announcements={announcements}
      />
    </>
  );
};