import React, { useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents';
import { CountdownTimer } from '../components/CountdownTimer';
import { CommentSection } from '../components/CommentSection';
import { StickyCountdownHeader } from '../components/StickyCountdownHeader';
import { FullscreenCountdownOverlay } from '../components/FullscreenCountdownOverlay';
import { SEOHead } from '../components/SEOHead';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { eventAPI } from '../services/api';
import { FavoriteButton } from '../components/FavoriteButton';

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const eventId = parseInt(id || '0', 10);
  const { showEventStarted, showSuccess, showError } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // イベント開始通知の重複を防ぐためのref
  const hasNotifiedRef = useRef(false);
  
  const { data: event, isLoading, error } = useEvent(eventId);

  const handleEventFinish = () => {
    // 既に通知済みの場合は何もしない
    if (hasNotifiedRef.current) {
      return;
    }
    
    // 既に開始されているイベントの場合は通知しない
    if (event) {
      const now = new Date();
      const startTime = new Date(event.start_datetime);
      if (now >= startTime) {
        return;
      }
      
      hasNotifiedRef.current = true;
      showEventStarted(event.title);
    }
  };

  const handleTagClick = (tag: string) => {
    // タグクリック時に検索ページに遷移
    navigate(`/?search=${encodeURIComponent(tag)}`);
  };

  const handleEditEvent = () => {
    navigate(`/register?edit=${eventId}`);
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('このイベントを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      await eventAPI.deleteEvent(eventId);
      showSuccess('イベントを削除しました');
      navigate('/');
    } catch (error) {
      showError('イベントの削除に失敗しました');
    }
  };

  // 現在のユーザーがこのイベントの作成者かチェック
  const isOwner = user && event && event.user_id === user.id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVenueTypeIcon = (venueType: string | null) => {
    switch (venueType) {
      case 'online': return '💻';
      case 'offline': return '🏢';
      case 'hybrid': return '🔄';
      default: return '📍';
    }
  };

  const getVenueTypeText = (venueType: string | null) => {
    switch (venueType) {
      case 'online': return 'オンライン開催';
      case 'offline': return 'オフライン開催';
      case 'hybrid': return 'ハイブリッド開催';
      default: return '開催形式：未設定';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            イベントが見つかりません
          </h2>
          <p className="text-gray-600 mb-4">
            指定されたイベントは存在しないか、削除された可能性があります。
          </p>
          <Link 
            to="/"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            イベント一覧に戻る
          </Link>
        </div>
      </div>
    );
  }

  // SEO用のメタデータを生成
  const getSEODataForEvent = () => {
    const startDate = new Date(event.start_datetime);
    const formattedDate = startDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    const title = `${event.title} - CountdownHub`;
    const description = `${event.title}のカウントダウンタイマー。開催日時: ${formattedDate}。${event.description ? event.description.substring(0, 100) + '...' : 'イベント詳細をチェック！'}`;
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": event.title,
      "description": event.description || title,
      "startDate": event.start_datetime,
      "endDate": event.end_datetime,
      "location": event.location ? {
        "@type": "Place",
        "name": event.location
      } : undefined,
      "image": event.image_url,
      "url": `https://countdown-hub.web.app/events/${event.id}`,
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": event.venue_type === 'online' 
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.venue_type === 'hybrid'
        ? "https://schema.org/MixedEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode"
    };
    
    return { title, description, structuredData };
  };

  return (
    <>
      <SEOHead 
        {...getSEODataForEvent()}
        ogImage={event.image_url || '/og-image.png'}
        canonicalUrl={`https://countdown-hub.web.app/events/${event.id}`}
      />
      
      {/* Sticky Header */}
      <StickyCountdownHeader
        targetDate={event.start_datetime}
        endDate={event.end_datetime || undefined}
        eventTitle={event.title}
        onFinish={handleEventFinish}
      />

      {/* Fullscreen Countdown Overlay */}
      <FullscreenCountdownOverlay
        targetDate={event.start_datetime}
        endDate={event.end_datetime || undefined}
        eventTitle={event.title}
        onFinish={handleEventFinish}
      />

      <div className="container mx-auto px-4 py-8">
        {/* ナビゲーション */}
        <nav className="mb-6">
          <Link 
            to="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← イベント一覧に戻る
          </Link>
        </nav>

      <div className="max-w-4xl mx-auto">
        {/* アイキャッチ画像 */}
        {event.image_url && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        {/* カウントダウンタイマー */}
        <div id="main-countdown-timer" className="mb-8 text-center">
          <CountdownTimer 
            targetDate={event.start_datetime}
            endDate={event.end_datetime || undefined}
            size="large"
            onFinish={handleEventFinish}
          />
        </div>

        {/* イベント情報 */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
              {event.title}
            </h1>
            
            {/* アクションボタン */}
            <div className="flex gap-1 sm:gap-2 flex-shrink-0">
              <FavoriteButton eventId={eventId} size="medium" />
              
              {isOwner && (
                <>
                  <button
                    onClick={handleEditEvent}
                    className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">✏️ 編集</span>
                    <span className="sm:hidden">✏️</span>
                  </button>
                  <button
                    onClick={handleDeleteEvent}
                    className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">🗑️ 削除</span>
                    <span className="sm:hidden">🗑️</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 統計情報 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              <span className="font-medium text-gray-900 text-sm sm:text-base">{event._count.favorites || 0}</span>
              <span className="text-gray-600 text-xs sm:text-sm">お気に入り</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-900 text-sm sm:text-base">{event._count.comments}</span>
              <span className="text-gray-600 text-xs sm:text-sm">コメント</span>
            </div>
          </div>

          {/* 基本情報 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">📅 開催日時</h3>
                <p className="text-gray-900">
                  {formatDate(event.start_datetime)}
                </p>
                {event.end_datetime && (
                  <p className="text-gray-600 text-sm mt-1">
                    終了: {formatDate(event.end_datetime)}
                  </p>
                )}
              </div>

              {event.location && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    {getVenueTypeIcon(event.venue_type)} 開催場所
                  </h3>
                  <p className="text-gray-900">{event.location}</p>
                  <p className="text-gray-600 text-sm">
                    {getVenueTypeText(event.venue_type)}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {event.site_url && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🔗 公式サイト</h3>
                  <a 
                    href={event.site_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 break-words"
                  >
                    {event.site_url}
                  </a>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">🏷️ タグ</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors cursor-pointer"
                        title={`"${tag}"で検索`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    タグをクリックすると、そのタグで検索できます
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* イベント詳細 */}
          {event.description && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-700 mb-4 text-xl">📝 イベント詳細</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* メタ情報 */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>作成者:</span>
                <span className="font-medium text-gray-700">
                  {event.user?.display_name || event.user?.username || '不明'}
                </span>
              </div>
              <div>
                作成日: {new Date(event.created_at).toLocaleDateString('ja-JP')}
              </div>
            </div>
          </div>
        </div>

        {/* コメントセクション */}
        <div className="mt-8">
          <CommentSection eventId={eventId} />
        </div>
      </div>
    </div>
    </>
  );
};