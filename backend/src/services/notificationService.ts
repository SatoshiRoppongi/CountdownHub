import { PrismaClient, NotificationType } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationService {
  // Create a notification for a specific user
  static async createNotification(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    event_id?: number;
    action_url?: string;
    action_text?: string;
    expires_at?: Date;
  }) {
    try {
      // Check user notification preferences
      const settings = await prisma.notificationSettings.findUnique({
        where: { user_id: data.user_id }
      });
      
      if (!this.shouldSendNotification(data.type, settings)) {
        return null;
      }
      
      const notification = await prisma.notification.create({ 
        data,
        include: {
          event: {
            select: { id: true, title: true, start_datetime: true }
          }
        }
      });
      
      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }
  
  // Create notification when an event starts
  static async createEventStartedNotification(eventId: number) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          favorites: true,
          user: { select: { id: true, display_name: true } }
        }
      });
      
      if (!event || !event.is_active) return;
      
      // Get all users interested in this event (creator + favorited users)
      const interestedUserIds = new Set([
        event.user_id, // Event creator
        ...event.favorites.map(f => f.user_id) // Users who favorited
      ].filter((id): id is string => Boolean(id)));
      
      for (const userId of interestedUserIds) {
        await this.createNotification({
          user_id: userId,
          type: 'event_started',
          title: 'イベント開始！',
          message: `「${event.title}」が開始しました！`,
          event_id: eventId,
          action_url: `/events/${eventId}`,
          action_text: 'イベントを見る'
        });
      }
    } catch (error) {
      console.error('Failed to create event started notifications:', error);
    }
  }
  
  // Create notification when a new comment is added
  static async createCommentNotification(eventId: number, commenterId: string, commenterName: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          favorites: true,
          user: { select: { id: true, display_name: true } }
        }
      });
      
      if (!event || !event.is_active) return;
      
      // Get all users interested in this event (creator + favorited users), excluding the commenter
      const interestedUserIds = new Set([
        event.user_id, // Event creator
        ...event.favorites.map(f => f.user_id) // Users who favorited
      ].filter((id): id is string => Boolean(id) && id !== commenterId));
      
      for (const userId of interestedUserIds) {
        await this.createNotification({
          user_id: userId,
          type: 'new_comment',
          title: '新しいコメント',
          message: `${commenterName}さんが「${event.title}」にコメントしました`,
          event_id: eventId,
          action_url: `/events/${eventId}#comments`,
          action_text: 'コメントを見る'
        });
      }
    } catch (error) {
      console.error('Failed to create comment notifications:', error);
    }
  }
  
  // Create notification when an event is updated
  static async createEventUpdatedNotification(eventId: number, updatedFields: string[]) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          favorites: true,
          user: { select: { id: true, display_name: true } }
        }
      });
      
      if (!event || !event.is_active) return;
      
      // Only notify favorited users (not the creator since they made the update)
      const userIds = event.favorites.map(f => f.user_id).filter((id): id is string => Boolean(id));
      
      const fieldsText = updatedFields.length > 1 ? 'イベント詳細' : updatedFields[0];
      
      for (const userId of userIds) {
        await this.createNotification({
          user_id: userId,
          type: 'event_updated',
          title: 'イベント更新',
          message: `お気に入りの「${event.title}」の${fieldsText}が更新されました`,
          event_id: eventId,
          action_url: `/events/${eventId}`,
          action_text: '変更を確認'
        });
      }
    } catch (error) {
      console.error('Failed to create event updated notifications:', error);
    }
  }
  
  // Create event reminder notifications (24h, 1h, 10min before)
  static async createEventReminder(eventId: number, timeBeforeEvent: string) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          favorites: true,
          user: { select: { id: true, display_name: true } }
        }
      });
      
      if (!event || !event.is_active) return;
      
      const userIds = [
        event.user_id, // Event creator
        ...event.favorites.map(f => f.user_id) // Users who favorited
      ].filter((id): id is string => Boolean(id));
      
      for (const userId of userIds) {
        await this.createNotification({
          user_id: userId,
          type: 'favorite_event_reminder',
          title: `${timeBeforeEvent}前のお知らせ`,
          message: `「${event.title}」の開始まで${timeBeforeEvent}です`,
          event_id: eventId,
          action_url: `/events/${eventId}`,
          action_text: 'イベントを見る'
        });
      }
    } catch (error) {
      console.error('Failed to create event reminder notifications:', error);
    }
  }
  
  // Create notification when an event is cancelled
  static async createEventCancelledNotification(eventId: number) {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { 
          favorites: true,
          user: { select: { id: true, display_name: true } }
        }
      });
      
      if (!event) return;
      
      // Notify all interested users (creator + favorited users)
      const userIds = [
        event.user_id, // Event creator
        ...event.favorites.map(f => f.user_id) // Users who favorited
      ].filter((id): id is string => Boolean(id));
      
      for (const userId of userIds) {
        await this.createNotification({
          user_id: userId,
          type: 'event_cancelled',
          title: 'イベントキャンセル',
          message: `「${event.title}」がキャンセルされました`,
          event_id: eventId,
          action_url: `/events/${eventId}`,
          action_text: '詳細を確認'
        });
      }
    } catch (error) {
      console.error('Failed to create event cancelled notifications:', error);
    }
  }
  
  // Clean up expired notifications
  static async cleanupExpiredNotifications() {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      });
      
      console.log(`Cleaned up ${result.count} expired notifications`);
      return result.count;
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
      return 0;
    }
  }
  
  // Check if notification should be sent based on user preferences
  private static shouldSendNotification(type: NotificationType, settings: any): boolean {
    if (!settings) return true; // Default to enabled if no settings
    
    if (!settings.browser_enabled) return false; // Browser notifications disabled
    
    switch (type) {
      case 'event_starting_soon':
      case 'favorite_event_reminder':
        return settings.event_reminders;
      case 'new_comment':
      case 'comment_reply':
        return settings.comment_notifications;
      case 'event_updated':
      case 'event_cancelled':
      case 'event_started':
        return settings.event_updates;
      case 'weekly_digest':
        return settings.weekly_digest;
      case 'system_maintenance':
      case 'feature_announcement':
      case 'event_trending':
        return true; // Always send system notifications
      default:
        return true;
    }
  }
}