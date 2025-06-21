import express from 'express';
import { 
  register, 
  login, 
  getProfile, 
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
  res.json({
    google: {
      configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      clientId: process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...` : null
    },
    firebase: {
      configured: !!process.env.FIREBASE_PROJECT_ID
    }
  });
});

// ソーシャルアカウント管理
router.post('/link-social', authenticateToken, linkSocialAccount);
router.post('/unlink-social', authenticateToken, unlinkSocialAccount);

export default router;