import dotenv from 'dotenv';
dotenv.config();

// セッション型定義はd.tsファイルで自動読み込み

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import passport from 'passport';
import session from 'express-session';

import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';
import eventRoutes from './routes/events';
import commentRoutes from './routes/comments';
import adminRoutes from './routes/admin';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import favoriteRoutes from './routes/favorites';
import notificationRoutes from './routes/notifications';
import firebaseAuthRoutes from './routes/firebaseAuth';
import contactRoutes from './routes/contact';
import announcementRoutes from './routes/announcements';
import reportRoutes from './routes/reports';
import './config/passport'; // Passport設定を読み込み

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10分に短縮（より柔軟な制限）
  max: process.env.NODE_ENV === 'development' ? 2000 : 1200, // 開発環境では2000リクエスト、本番では10分間1200リクエスト
  message: 'Too many requests from this IP, please try again later.',
});

app.use(helmet());

// CORS設定
const corsOptions = {
  origin: [
    'https://countdownhub.jp',
    'https://www.countdownhub.jp',
    'http://localhost:3000', // 開発環境
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: true,
  optionsSuccessStatus: 200, // for legacy browser support
  preflightContinue: false,
};

// CORS設定の詳細ログ
app.use((req, _res, next) => {
  const origin = req.headers.origin;
  if (process.env.NODE_ENV === 'production' && req.method === 'OPTIONS') {
    console.log(`🔍 CORS Preflight Request:`, {
      method: req.method,
      url: req.url,
      origin: origin,
      headers: req.headers
    });
  }
  next();
});

app.use(cors(corsOptions));

// プリフライトリクエストの明示的処理
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  console.log(`OPTIONS request from origin: ${origin}`);
  
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// CORS設定の確認ログ
console.log('🔧 CORS Configuration:', {
  environment: process.env.NODE_ENV,
  allowedOrigins: corsOptions.origin,
  allowedMethods: corsOptions.methods,
  allowedHeaders: corsOptions.allowedHeaders
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// セッション設定（Twitter OAuth用）
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-this-in-production',
  resave: true, // 本番環境でのセッション保持を強制
  saveUninitialized: true, // Twitter OAuth 1.0aでは必須
  name: 'countdownhub.sid', // セッション名を明示的に設定
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.TWITTER_OAUTH_SECURE !== 'false', // 本番環境ではHTTPS必須（ただしTwitter OAuth時は一時的に無効化可能）
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1時間に延長（Render環境でのタイムアウト対策）
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' as const : 'lax' as const, // 本番環境でもlaxに変更（Twitter OAuth互換性）
    domain: undefined // ドメイン設定を無効化（Render環境対応）
  },
  // 本番環境でのセッション永続化設定
  ...(process.env.NODE_ENV === 'production' && {
    rolling: true, // アクティブセッションの自動延長
    unset: 'keep' as const // セッション削除時の動作
  })
};

console.log('🔧 Session Configuration:', {
  environment: process.env.NODE_ENV,
  sessionName: sessionConfig.name,
  cookieSecure: sessionConfig.cookie?.secure,
  cookieSameSite: sessionConfig.cookie?.sameSite,
  cookieDomain: sessionConfig.cookie?.domain,
  maxAge: sessionConfig.cookie?.maxAge
});

app.use((session as any)(sessionConfig));

// セッションデバッグミドルウェア（本番環境のTwitter OAuth用）
if (process.env.NODE_ENV === 'production' && process.env.TWITTER_OAUTH_DEBUG === 'true') {
  app.use((req, res, next) => {
    if (req.path.includes('/auth/twitter')) {
      const sessionReq = req as any; // TypeScript回避
      console.log('🔍 Twitter OAuth Request:', {
        method: req.method,
        path: req.path,
        sessionID: sessionReq.sessionID || 'not available',
        sessionExists: !!sessionReq.session,
        sessionData: sessionReq.session ? Object.keys(sessionReq.session) : 'no session',
        cookies: req.headers.cookie ? 'present' : 'missing'
      });
    }
    next();
  });
}

app.use(passport.initialize());
app.use(passport.session());
app.use(logger);

app.use('/api/auth', authRoutes);
app.use('/api/auth', firebaseAuthRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/reports', reportRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});