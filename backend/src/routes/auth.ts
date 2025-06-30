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
  twitterAuth,
  twitterCallback,
  linkSocialAccount,
  unlinkSocialAccount,
  checkDisplayNameAvailability,
  getUserProfile,
  getUserPublicEvents,
  searchUsers,
  followUser,
  unfollowUser,
  getUserFollowers,
  getUserFollowing
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

// ニックネーム重複チェック
router.get('/check-display-name', checkDisplayNameAvailability);

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

// Twitter OAuth ルート (環境変数が設定されている場合のみ)
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  router.get('/twitter', twitterAuth);
  router.get('/twitter/callback', twitterCallback);
} else {
  router.get('/twitter', (req, res) => {
    res.status(501).json({ 
      error: 'Twitter OAuth is not configured. Please set TWITTER_CONSUMER_KEY and TWITTER_CONSUMER_SECRET environment variables.' 
    });
  });
  router.get('/twitter/callback', (req, res) => {
    res.status(501).json({ 
      error: 'Twitter OAuth is not configured.' 
    });
  });
}

// OAuth設定状況確認
router.get('/oauth-status', (req, res) => {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const twitterConfigured = !!(process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET);
  
  res.json({
    google: {
      configured: googleConfigured,
      clientId: process.env.GOOGLE_CLIENT_ID || 'not set',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? '***configured***' : 'not set',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'not set',
      message: googleConfigured 
        ? 'Google OAuth is properly configured' 
        : 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file'
    },
    twitter: {
      configured: twitterConfigured,
      consumerKey: process.env.TWITTER_CONSUMER_KEY || 'not set',
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET ? '***configured***' : 'not set',
      callbackUrl: process.env.TWITTER_CALLBACK_URL || 'not set',
      message: twitterConfigured 
        ? 'Twitter OAuth is properly configured' 
        : 'Twitter OAuth is not configured. Please set TWITTER_CONSUMER_KEY and TWITTER_CONSUMER_SECRET in .env file'
    },
    firebase: {
      configured: !!process.env.FIREBASE_PROJECT_ID
    },
    setup_guide: '/docs/oauth-setup.md',
    troubleshooting_guide: '/docs/oauth-troubleshooting.md'
  });
});

// Google OAuth デバッグ用エンドポイント
router.get('/google/debug', (req, res) => {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback')}&` +
    `response_type=code&` +
    `scope=profile email&` +
    `access_type=offline`;
    
  res.json({
    authUrl,
    clientId: process.env.GOOGLE_CLIENT_ID,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
    note: 'このURLでGoogle認証をテストできます'
  });
});

// ソーシャルアカウント管理
router.post('/link-social', authenticateToken, linkSocialAccount);
router.post('/unlink-social', authenticateToken, unlinkSocialAccount);

// ユーザー検索・プロフィール関連
router.get('/search/users', searchUsers);
router.get('/users/:username', getUserProfile);
router.get('/users/:username/events', getUserPublicEvents);

// フォロー・フォロワー機能
router.post('/users/:username/follow', authenticateToken, followUser);
router.delete('/users/:username/follow', authenticateToken, unfollowUser);
router.get('/users/:username/followers', getUserFollowers);
router.get('/users/:username/following', getUserFollowing);

export default router;