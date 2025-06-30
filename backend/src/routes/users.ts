import express from 'express';
import { getUserEvents, getUserComments, getUserProfile, getUserPublicEvents, searchUsers } from '../controllers/authController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = express.Router();

// 認証が必要なユーザーのコンテンツ取得
router.get('/events', authenticateToken, getUserEvents);
router.get('/comments', authenticateToken, getUserComments);

// ユーザー検索
router.get('/search', searchUsers);

// パブリックユーザー情報取得（認証はオプショナル）
router.get('/:username', optionalAuth, getUserProfile);
router.get('/:username/events', optionalAuth, getUserPublicEvents);

export default router;