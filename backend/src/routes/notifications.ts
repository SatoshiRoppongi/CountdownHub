import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotificationSettings,
  updateNotificationSettings,
  getUnreadCount
} from '../controllers/notificationController';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Get user notifications
router.get('/', getUserNotifications);

// Get unread count only
router.get('/unread-count', getUnreadCount);

// Mark specific notifications as read
router.patch('/mark-read', markNotificationsAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete specific notification
router.delete('/:id', deleteNotification);

// Notification settings
router.get('/settings', getNotificationSettings);
router.patch('/settings', updateNotificationSettings);

export default router;