import express from 'express';
import { body } from 'express-validator';
import { 
  createReport,
  getReports,
  updateReportStatus,
  getReportStats
} from '../controllers/reportController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// 通報作成
router.post(
  '/',
  authenticateToken,
  [
    body('type').isIn(['user', 'comment', 'event']).withMessage('有効な通報タイプを選択してください'),
    body('target_id').notEmpty().withMessage('通報対象IDは必須です'),
    body('reason').notEmpty().withMessage('通報理由は必須です'),
    body('description').optional().isLength({ max: 1000 }).withMessage('詳細説明は1000文字以下で入力してください')
  ],
  createReport
);

// 管理者向け：通報一覧取得
router.get('/', authenticateToken, getReports);

// 管理者向け：通報統計取得
router.get('/stats', authenticateToken, getReportStats);

// 管理者向け：通報ステータス更新
router.patch(
  '/:id/status',
  authenticateToken,
  [
    body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed']).withMessage('有効なステータスを選択してください')
  ],
  updateReportStatus
);

export default router;