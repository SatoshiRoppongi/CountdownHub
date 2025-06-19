# CountdownHub Notification System - Complete Guide

## 🎉 System Overview

The notification system provides real-time updates to users about events they care about, including new comments, event updates, and event reminders.

## 📊 Features Implemented

### ✅ Automatic Notifications

1. **New Comment Notifications**
   - Triggered when someone comments on an event
   - Notifies event creator and users who favorited the event
   - Excludes the commenter to avoid self-notifications

2. **Event Update Notifications**
   - Triggered when event details are modified
   - Notifies users who favorited the event
   - Excludes the event creator (who made the update)

3. **Event Cancellation Notifications**
   - Triggered when an event is deactivated/cancelled
   - Notifies event creator and users who favorited the event

4. **Event Start Notifications** (Framework Ready)
   - Can be triggered when countdown reaches zero
   - Ready for integration with existing countdown timer

### ✅ User Interface

1. **Notification Bell**
   - Located in header (visible when logged in)
   - Shows unread count badge (supports 99+)
   - Click to open notification dropdown

2. **Notification Dropdown**
   - Shows last 10 notifications
   - Real-time updates every 30 seconds
   - Type-specific icons (🎉, 💬, 📝, ❌, ⭐)
   - Time formatting (2分前, 1時間前, etc.)
   - Action buttons to navigate to related events

3. **Notification Management**
   - Mark individual notifications as read
   - Mark all notifications as read
   - Auto-cleanup of expired notifications

### ✅ User Preferences

1. **Notification Settings** (API Ready)
   - Email notifications on/off
   - Browser notifications on/off
   - Event reminders on/off
   - Comment notifications on/off
   - Event updates on/off
   - Weekly digest on/off

## 🛠️ Technical Implementation

### Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    type NotificationType NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    action_text VARCHAR(100),
    event_id INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Notification settings table
CREATE TABLE notification_settings (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    browser_enabled BOOLEAN DEFAULT true,
    event_reminders BOOLEAN DEFAULT true,
    comment_notifications BOOLEAN DEFAULT true,
    event_updates BOOLEAN DEFAULT true,
    weekly_digest BOOLEAN DEFAULT true
);

-- Notification types enum
CREATE TYPE NotificationType AS ENUM (
    'event_starting_soon',
    'event_started',
    'new_comment',
    'comment_reply',
    'event_updated',
    'event_cancelled',
    'favorite_event_reminder',
    'event_trending',
    'weekly_digest',
    'system_maintenance',
    'feature_announcement'
);
```

### API Endpoints

```http
# Get user notifications (with pagination)
GET /api/notifications?page=1&limit=20&unread_only=false

# Get unread count for notification bell
GET /api/notifications/unread-count

# Mark specific notifications as read
PATCH /api/notifications/mark-read
Content-Type: application/json
{
  "notification_ids": [1, 2, 3]
}

# Mark all notifications as read
PATCH /api/notifications/mark-all-read

# Delete specific notification
DELETE /api/notifications/{id}

# Get notification settings
GET /api/notifications/settings

# Update notification settings
PATCH /api/notifications/settings
Content-Type: application/json
{
  "email_enabled": true,
  "browser_enabled": true,
  "event_reminders": true,
  "comment_notifications": true,
  "event_updates": true,
  "weekly_digest": false
}
```

## 🧪 Testing the Notification System

### 1. Test Comment Notifications

1. **Setup:**
   - User A creates an event
   - User B favorites the event
   - User C logs in

2. **Test:**
   - User C adds a comment to the event
   - Check that User A and User B receive notifications
   - Check that User C does NOT receive a notification (self-exclusion)

3. **Verify:**
   - Notification bell shows unread count
   - Dropdown shows new comment notification
   - Click notification navigates to event#comments

### 2. Test Event Update Notifications

1. **Setup:**
   - User A creates an event
   - User B favorites the event

2. **Test:**
   - User A updates the event (title, description, etc.)
   - Check that User B receives a notification
   - Check that User A does NOT receive a notification (self-exclusion)

3. **Verify:**
   - Notification shows "イベント更新" type
   - Click notification navigates to event page

### 3. Test Event Cancellation Notifications

1. **Setup:**
   - User A creates an event
   - User B favorites the event

2. **Test:**
   - User A deletes/cancels the event
   - Check that both User A and User B receive notifications

3. **Verify:**
   - Notification shows "イベントキャンセル" type
   - Notification explains the event was cancelled

### 4. Test Real-time Updates

1. **Setup:**
   - User A is logged in with notification dropdown open

2. **Test:**
   - User B performs an action that should notify User A
   - Wait up to 30 seconds (polling interval)

3. **Verify:**
   - Unread count updates automatically
   - New notification appears in dropdown

## 🔧 Manual Testing Commands

### Create Test Notification (Direct Database)

```sql
-- Connect to database
docker-compose exec db psql -U countdown_user -d countdown_hub

-- Create test notification
INSERT INTO notifications (user_id, type, title, message, action_url, action_text, event_id)
VALUES ('your-user-id', 'new_comment', 'テスト通知', 'これはテスト通知です', '/events/1', 'イベントを見る', 1);
```

### Test API with curl

```bash
# Get user notifications (requires auth token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/notifications

# Get unread count
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/notifications/unread-count

# Mark notification as read
curl -X PATCH \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"notification_ids": [1]}' \
     http://localhost:3001/api/notifications/mark-read
```

## 🚀 Future Enhancements (Ready for Implementation)

### 1. Event Reminder System

```typescript
// Add to backend cron job
import cron from 'node-cron';

// Check for events starting in 24 hours (runs hourly)
cron.schedule('0 * * * *', async () => {
  const tomorrow = new Date();
  tomorrow.setHours(tomorrow.getHours() + 24);
  
  const events = await getEventsStartingAt(tomorrow);
  for (const event of events) {
    await NotificationService.createEventReminder(event.id, '24時間');
  }
});
```

### 2. Server-Sent Events (Real-time)

```typescript
// Backend SSE endpoint
router.get('/stream', authenticateJWT, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  // Store connection and send notifications in real-time
});
```

### 3. Email Notifications

```typescript
// Add email service integration
import nodemailer from 'nodemailer';

export class EmailNotificationService {
  static async sendEmailNotification(notification: Notification) {
    // Send email using nodemailer or service like SendGrid
  }
}
```

### 4. Push Notifications

```typescript
// Add service worker for browser push notifications
// Integrate with Firebase Cloud Messaging or similar
```

## 📱 Mobile Responsiveness

The notification system is fully responsive:
- Notification bell adapts to mobile screens
- Dropdown panel adjusts width on mobile
- Touch-friendly interactions
- Readable text sizes across devices

## 🔒 Security Considerations

1. **Authentication Required:** All notification endpoints require valid JWT
2. **User Isolation:** Users can only access their own notifications
3. **Input Validation:** All inputs are validated and sanitized
4. **Rate Limiting:** Built-in rate limiting prevents abuse
5. **SQL Injection Protection:** Prisma ORM provides protection

## 📊 Performance Optimization

1. **Database Indices:** All frequently queried fields are indexed
2. **Pagination:** Large notification lists are paginated
3. **Polling Optimization:** 30-second intervals balance real-time feel with performance
4. **Lazy Loading:** Notifications load only when dropdown is opened
5. **Cleanup Jobs:** Expired notifications are automatically removed

## 🎯 Success Metrics

Track these metrics to measure notification system success:

1. **Engagement Metrics:**
   - Notification click-through rate
   - Time to read notifications
   - User retention after receiving notifications

2. **Technical Metrics:**
   - API response times
   - Database query performance
   - Real-time update latency

3. **User Experience Metrics:**
   - Notification relevance scores
   - User preference changes
   - Support tickets related to notifications

---

The notification system is now fully operational and ready to enhance user engagement in CountdownHub! 🎉