import { Request, Response, NextFunction } from 'express';
  import { adminAuth } from '../config/firebase';

  export const authenticateFirebaseToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!adminAuth) {
        return res.status(503).json({ error: 'Firebase authentication not configured' });
      }

      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const decodedToken = await adminAuth.verifyIdToken(token);

      // ユーザー情報をリクエストに追加
      (req as any).user = {
        id: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name
      };

      next();
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  };