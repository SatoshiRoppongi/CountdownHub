import { Router } from 'express';
import multer from 'multer';
import { getStats, importEventsFromCSV, getUsers, getUserById, updateUserStatus } from '../controllers/adminController';
import { requireAdmin, checkAdminStatus } from '../middleware/adminAuth';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// 管理者ステータス確認
router.get('/status', authenticateToken, checkAdminStatus);

// 管理者限定エンドポイント
router.get('/stats', requireAdmin, getStats);
router.post('/events/import', requireAdmin, upload.single('csvFile'), importEventsFromCSV);

// ユーザー管理
router.get('/users', requireAdmin, getUsers);
router.get('/users/:id', requireAdmin, getUserById);
router.patch('/users/:id/status', requireAdmin, updateUserStatus);

export default router;