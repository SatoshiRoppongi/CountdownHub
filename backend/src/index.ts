import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import passport from 'passport';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import eventRoutes from './routes/events';
import commentRoutes from './routes/comments';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import favoriteRoutes from './routes/favorites';
import notificationRoutes from './routes/notifications';
import firebaseAuthRoutes from './routes/firebaseAuth';
import './config/passport'; // Passport設定を読み込み

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/auth', firebaseAuthRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});