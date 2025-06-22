import { Request, Response, NextFunction } from 'express';
import { authenticateToken } from './auth';

// 管理者権限チェック
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  // まず通常の認証をチェック
  authenticateToken(req, res, (error) => {
    if (error) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const user = (req as any).user;
    
    // 管理者判定ロジック
    // セルフサインアップ不可能なユーザー（特定のメールドメインまたは事前登録）
    if (!user || !isAdminUser(user)) {
      return res.status(403).json({ 
        error: '管理者権限が必要です。一般ユーザーはアクセスできません。' 
      });
    }

    next();
  });
};

// 管理者ユーザーかどうかを判定
function isAdminUser(user: any): boolean {
  // 管理者の判定ロジック
  // 1. 特定のメールドメイン
  const adminDomains = ['admin.countdownhub.jp', 'management.countdownhub.jp'];
  if (adminDomains.some(domain => user.email?.endsWith(`@${domain}`))) {
    return true;
  }

  // 2. 事前に登録された管理者アカウント
  const adminEmails = [
    // 環境変数から管理者メールアドレスを取得
    process.env.ADMIN_EMAIL_1,
    process.env.ADMIN_EMAIL_2,
    process.env.ADMIN_EMAIL_3,
  ].filter(Boolean);

  if (adminEmails.includes(user.email)) {
    return true;
  }

  // 3. 特殊なユーザー名パターン（admin_で始まる）
  if (user.username?.startsWith('admin_')) {
    return true;
  }

  // 4. auth_providerが'admin'の場合（特別な管理者アカウント）
  if (user.auth_provider === 'admin') {
    return true;
  }

  return false;
}

// 管理者ステータスを確認するエンドポイント用
export const checkAdminStatus = (req: Request, res: Response) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ 
      isAdmin: false, 
      error: '認証が必要です' 
    });
  }

  const isAdmin = isAdminUser(user);
  
  res.json({
    isAdmin,
    user: {
      email: user.email,
      username: user.username,
      auth_provider: user.auth_provider
    }
  });
};