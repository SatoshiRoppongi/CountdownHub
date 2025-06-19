import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// JWTトークンを検証するミドルウェア
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'アクセストークンが必要です' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    
    // ユーザーが存在し、アクティブかチェック
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        is_active: true
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: '無効なトークンです' });
    }

    // リクエストオブジェクトにユーザー情報を追加
    (req as any).user = user;
    next();

  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: '無効なトークンです' });
  }
};

// オプショナル認証ミドルウェア（ログインしていなくても通す）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // トークンがない場合はそのまま通す
      (req as any).user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        is_active: true
      }
    });

    if (user && user.is_active) {
      (req as any).user = user;
    } else {
      (req as any).user = null;
    }

    next();

  } catch (error) {
    // トークンが無効でもそのまま通す（ログなし）
    (req as any).user = null;
    next();
  }
};

// 開発モードチェックミドルウェア
export const developmentMode = (req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEVELOPMENT_MODE === 'true';
  
  if (isDevelopment) {
    // 開発モードの場合は認証をスキップ
    (req as any).user = {
      id: 'dev-user',
      email: 'dev@example.com',
      username: 'developer',
      display_name: '開発者',
      is_active: true
    };
  }
  
  next();
};