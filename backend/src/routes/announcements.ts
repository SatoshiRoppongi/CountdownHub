import express from 'express';
import { body } from 'express-validator';
import { 
  getAnnouncementsAdmin,
  getActiveAnnouncements,
  createAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement
} from '../controllers/announcementController';
import { optionalAuth, requireAuth } from '../middleware/auth';

const router = express.Router();

// お知らせ作成・更新のバリデーション
const announcementValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('タイトルは1文字以上255文字以下で入力してください'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('内容は1文字以上10000文字以下で入力してください'),
  body('type')
    .isIn(['info', 'maintenance', 'feature', 'warning', 'emergency'])
    .withMessage('有効なタイプを選択してください'),
  body('priority')
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('有効な優先度を選択してください'),
  body('is_active')
    .isBoolean()
    .withMessage('有効/無効は真偽値で設定してください'),
  body('start_date')
    .optional()
    .isISO8601()
    .withMessage('開始日時は有効な日時形式で入力してください'),
  body('end_date')
    .optional()
    .isISO8601()
    .withMessage('終了日時は有効な日時形式で入力してください')
];

// ユーザー向け：アクティブなお知らせ一覧取得（認証不要）
router.get('/active', getActiveAnnouncements);

// 管理者向け：お知らせ一覧取得（認証必要）
router.get('/admin', requireAuth, getAnnouncementsAdmin);

// お知らせ作成（認証必要）
router.post('/', requireAuth, announcementValidation, createAnnouncement);

// 特定のお知らせ取得
router.get('/:id', optionalAuth, getAnnouncementById);

// お知らせ更新（認証必要）
router.put('/:id', requireAuth, announcementValidation, updateAnnouncement);

// お知らせ削除（認証必要）
router.delete('/:id', requireAuth, deleteAnnouncement);

export default router;