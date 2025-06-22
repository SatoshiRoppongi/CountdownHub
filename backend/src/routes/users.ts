import express from 'express';
import { getUserEvents, getUserComments } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// ユーザーのコンテンツ取得
router.get('/events', authenticateToken, getUserEvents);
router.get('/comments', authenticateToken, getUserComments);

export default router;