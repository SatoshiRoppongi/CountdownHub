 import { Router } from 'express';
  import { PrismaClient } from '@prisma/client';
  import { authenticateFirebaseToken } from '../middleware/firebaseAuth';

  const router = Router();
  const prisma = new PrismaClient();

  // Firebase ユーザーをバックエンドDBと同期
  router.post('/firebase-sync', authenticateFirebaseToken, async (req, res) => {
    try {
      const { uid, email, displayName, photoURL, provider } = req.body;

      const user = await prisma.user.upsert({
        where: { id: uid },
        update: {
          email: email || '',
          display_name: displayName || email?.split('@')[0] || 'User',
          avatar_url: photoURL,
          auth_provider: provider || 'firebase',
          updated_at: new Date()
        },
        create: {
          id: uid,
          email: email || '',
          username: email?.split('@')[0] || `user_${uid.slice(0, 8)}`,
          display_name: displayName || email?.split('@')[0] || 'User',
          avatar_url: photoURL,
          auth_provider: provider || 'firebase',
          password: null // Firebase users don't need passwords
        }
      });

      res.json({ user, success: true });
    } catch (error) {
      console.error('User sync failed:', error);
      res.status(500).json({ error: 'Failed to sync user' });
    }
  });

  export default router;