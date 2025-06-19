import { Router } from 'express';
import {
  addFavorite,
  removeFavorite,
  getUserFavorites,
  checkFavoriteStatus
} from '../controllers/favoriteController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// お気に入り追加
router.post('/events/:eventId', authenticateToken, addFavorite);

// お気に入り削除
router.delete('/events/:eventId', authenticateToken, removeFavorite);

// ユーザーのお気に入り一覧取得
router.get('/', authenticateToken, getUserFavorites);

// お気に入り状態チェック（認証オプショナル）
router.get('/events/:eventId/status', optionalAuth, checkFavoriteStatus);

export default router;