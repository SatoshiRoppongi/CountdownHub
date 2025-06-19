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

// Google OAuth ルート
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// ソーシャルアカウント管理
router.post('/link-social', authenticateToken, linkSocialAccount);
router.post('/unlink-social', authenticateToken, unlinkSocialAccount);

export default router;