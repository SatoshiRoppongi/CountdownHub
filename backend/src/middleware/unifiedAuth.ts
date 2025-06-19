import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { adminAuth } from '../config/firebase';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  username: string;
}

// Firebase + JWT 統合認証ミドルウェア
export const authenticateUnifiedToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    let user;

    try {
      // Try Firebase token first
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      // Get user from database using Firebase UID
      user = await prisma.user.findUnique({
        where: { id: decodedToken.uid },
        select: {
          id: true,
          email: true,
          username: true,
          display_name: true,
          is_active: true
        }
      });

      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'User not found or inactive' });
      }

    } catch (firebaseError) {
      // Fallback to JWT token for backward compatibility
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
        
        user = await prisma.user.findUnique({
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
          return res.status(401).json({ error: 'Invalid token or user not found' });
        }
      } catch (jwtError) {
        return res.status(403).json({ error: 'Invalid token' });
      }
    }

    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Authentication failed' });
  }
};

// オプショナル統合認証ミドルウェア
export const optionalUnifiedAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      (req as any).user = null;
      return next();
    }

    let user = null;

    try {
      // Try Firebase token first
      const decodedToken = await adminAuth.verifyIdToken(token);
      
      user = await prisma.user.findUnique({
        where: { id: decodedToken.uid },
        select: {
          id: true,
          email: true,
          username: true,
          display_name: true,
          is_active: true
        }
      });

    } catch (firebaseError) {
      // Fallback to JWT token
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as JWTPayload;
        
        user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            email: true,
            username: true,
            display_name: true,
            is_active: true
          }
        });
      } catch (jwtError) {
        // Both tokens failed, continue as unauthenticated
      }
    }

    (req as any).user = (user && user.is_active) ? user : null;
    next();

  } catch (error) {
    (req as any).user = null;
    next();
  }
};

// 開発モードチェックミドルウェア (既存と同じ)
export const developmentMode = (req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEVELOPMENT_MODE === 'true';
  
  if (isDevelopment) {
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