import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get user notifications with pagination
export const getUserNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { page = 1, limit = 20, unread_only = false } = req.query;
    
    const where: any = { user_id: user.id };
    if (unread_only === 'true') {
      where.read = false;
    }
    
    // Filter out expired notifications
    where.OR = [
      { expires_at: null },
      { expires_at: { gt: new Date() } }
    ];
    
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          event: {
            select: { id: true, title: true, start_datetime: true }
          }
        }
      }),
      prisma.notification.count({
        where: { 
          user_id: user.id, 
          read: false,
          OR: [
            { expires_at: null },
            { expires_at: { gt: new Date() } }
          ]
        }
      })
    ]);
    
    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// Mark notifications as read
export const markNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { notification_ids } = req.body;
    
    if (!Array.isArray(notification_ids) || notification_ids.length === 0) {
      return res.status(400).json({ error: 'notification_ids array is required' });
    }
    
    await prisma.notification.updateMany({
      where: {
        id: { in: notification_ids },
        user_id: user.id
      },
      data: { read: true }
    });
    
    res.json({ success: true, message: '通知を既読にしました' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    await prisma.notification.updateMany({
      where: {
        user_id: user.id,
        read: false
      },
      data: { read: true }
    });
    
    res.json({ success: true, message: 'すべての通知を既読にしました' });
  } catch (error) {
    next(error);
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    const notification = await prisma.notification.findFirst({
      where: { id: parseInt(id), user_id: user.id }
    });
    
    if (!notification) {
      return res.status(404).json({ error: '通知が見つかりません' });
    }
    
    await prisma.notification.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ success: true, message: '通知を削除しました' });
  } catch (error) {
    next(error);
  }
};

// Get notification settings
export const getNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    let settings = await prisma.notificationSettings.findUnique({
      where: { user_id: user.id }
    });
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          user_id: user.id,
          email_enabled: true,
          browser_enabled: true,
          event_reminders: true,
          comment_notifications: true,
          event_updates: true,
          weekly_digest: true
        }
      });
    }
    
    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// Update notification settings
export const updateNotificationSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const {
      email_enabled,
      browser_enabled,
      event_reminders,
      comment_notifications,
      event_updates,
      weekly_digest
    } = req.body;
    
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: user.id },
      update: {
        email_enabled: email_enabled ?? undefined,
        browser_enabled: browser_enabled ?? undefined,
        event_reminders: event_reminders ?? undefined,
        comment_notifications: comment_notifications ?? undefined,
        event_updates: event_updates ?? undefined,
        weekly_digest: weekly_digest ?? undefined
      },
      create: {
        user_id: user.id,
        email_enabled: email_enabled ?? true,
        browser_enabled: browser_enabled ?? true,
        event_reminders: event_reminders ?? true,
        comment_notifications: comment_notifications ?? true,
        event_updates: event_updates ?? true,
        weekly_digest: weekly_digest ?? true
      }
    });
    
    res.json({ 
      settings, 
      success: true, 
      message: '通知設定を更新しました' 
    });
  } catch (error) {
    next(error);
  }
};

// Get unread count only (for notification bell)
export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    const unreadCount = await prisma.notification.count({
      where: { 
        user_id: user.id, 
        read: false,
        OR: [
          { expires_at: null },
          { expires_at: { gt: new Date() } }
        ]
      }
    });
    
    res.json({ unreadCount });
  } catch (error) {
    next(error);
  }
};