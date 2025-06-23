import express from 'express';
import { body } from 'express-validator';
import { 
  createContact, 
  getContacts, 
  getContactById, 
  updateContactStatus 
} from '../controllers/contactController';
import { optionalAuth } from '../middleware/auth';

const router = express.Router();

// お問い合わせ作成のバリデーション
const createContactValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('お名前は1文字以上100文字以下で入力してください'),
  body('email')
    .isEmail()
    .isLength({ max: 255 })
    .withMessage('有効なメールアドレスを入力してください'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('件名は1文字以上255文字以下で入力してください'),
  body('category')
    .isIn(['general', 'technical', 'bug', 'feature', 'account', 'other'])
    .withMessage('有効なカテゴリを選択してください'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 10000 })
    .withMessage('お問い合わせ内容は10文字以上10000文字以下で入力してください')
];

// お問い合わせ作成（公開API）
router.post('/', createContactValidation, createContact);

// お問い合わせ一覧取得（管理者のみ）
// TODO: 管理者認証ミドルウェアを追加
router.get('/', optionalAuth, getContacts);

// 特定のお問い合わせ取得（管理者のみ）
// TODO: 管理者認証ミドルウェアを追加
router.get('/:id', optionalAuth, getContactById);

// お問い合わせステータス更新（管理者のみ）
// TODO: 管理者認証ミドルウェアを追加
router.patch('/:id/status', optionalAuth, updateContactStatus);

export default router;