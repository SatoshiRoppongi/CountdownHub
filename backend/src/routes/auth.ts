import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile,
  getUserEvents,
  getUserComments,
  logout,
  googleAuth,
  googleCallback,
  linkSocialAccount,
  unlinkSocialAccount
} from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 基本認証関連ルート
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authenticateToken, getProfile);
router.patch('/profile', authenticateToken, updateProfile);
router.get('/profile/events', authenticateToken, getUserEvents);
router.get('/profile/comments', authenticateToken, getUserComments);

// Google OAuth ルート (環境変数が設定されている場合のみ)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get('/google', googleAuth);
  router.get('/google/callback', googleCallback);
} else {
  router.get('/google', (req, res) => {
    res.status(501).json({ 
      error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.' 
    });
  });
  router.get('/google/callback', (req, res) => {
    res.status(501).json({ 
      error: 'Google OAuth is not configured.' 
    });
  });
}

// OAuth設定状況確認
router.get('/oauth-status', (req, res) => {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  
  res.json({
    google: {
      configured: googleConfigured,
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...` : null,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'not set',
      message: googleConfigured 
        ? 'Google OAuth is properly configured' 
        : 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
    },
    firebase: {
      configured: !!process.env.FIREBASE_PROJECT_ID
    },
    setup_guide: '/docs/google-oauth-setup.md'
  });
});

// ソーシャルアカウント管理
router.post('/link-social', authenticateToken, linkSocialAccount);
router.post('/unlink-social', authenticateToken, unlinkSocialAccount);

export default router;