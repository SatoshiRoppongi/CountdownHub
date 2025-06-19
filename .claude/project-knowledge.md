# CountdownHub - 技術的知見・パターン

## アーキテクチャパターン

### フロントエンド構成
```
frontend/src/
├── components/           # 再利用可能なUIコンポーネント
│   ├── ui/              # 基本UIコンポーネント
│   ├── features/        # 機能固有のコンポーネント
│   └── layout/          # レイアウトコンポーネント
├── pages/              # ルーティング用ページコンポーネント
├── hooks/              # カスタムフック
├── services/           # API通信ロジック
├── types/              # TypeScript型定義
└── utils/              # ユーティリティ関数
```

### バックエンド構成
```
backend/src/
├── controllers/        # リクエスト処理ロジック
├── routes/            # エンドポイント定義
├── middleware/        # 共通処理（認証、ログ、エラーハンドリング）
├── services/          # ビジネスロジック
├── types/             # TypeScript型定義
└── utils/             # ユーティリティ関数
```

## 技術的決定事項

### 状態管理
- **React Query**: サーバー状態の管理
- **useState/useContext**: ローカル状態の管理
- **避けるべき**: Redux（オーバーエンジニアリング）

### スタイリング
- **Tailwind CSS**: ユーティリティファーストCSS
- **CSS Modules**: 避ける（Tailwindで十分）
- **styled-components**: 避ける（バンドルサイズ増加）

### API通信
- **Axios**: HTTP クライアント
- **React Query**: キャッシュ・同期・エラーハンドリング
- **fetch**: 使用しない（Axiosの方が機能豊富）

## 実装パターン

### カスタムフック命名
```typescript
// 良い例
useEvents()
useCountdown()
useEventForm()

// 避けるべき例
getEvents()
eventHook()
useEventData()
```

### コンポーネント設計パターン
```typescript
// プレゼンテーションコンポーネント
interface EventCardProps {
  event: Event;
  onCommentClick: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onCommentClick }) => {
  // UIロジックのみ
};

// コンテナコンポーネント
export const EventCardContainer: React.FC<{ eventId: string }> = ({ eventId }) => {
  const { data: event } = useEvent(eventId);
  const handleCommentClick = () => {
    // ビジネスロジック
  };
  
  return <EventCard event={event} onCommentClick={handleCommentClick} />;
};
```

### API エンドポイント設計
```typescript
// RESTful設計
GET    /api/events                 // イベント一覧
GET    /api/events/:id             // イベント詳細
POST   /api/events                 // イベント作成
PUT    /api/events/:id             // イベント更新
DELETE /api/events/:id             // イベント削除

// ネストリソース
GET    /api/events/:id/comments    // イベントのコメント一覧
POST   /api/events/:id/comments    // コメント作成
DELETE /api/comments/:id           // コメント削除
```

### エラーハンドリングパターン
```typescript
// バックエンド
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  logger.error(`${statusCode}: ${message}`, { url: req.url, method: req.method });
  
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// フロントエンド
const { data, error, isLoading } = useQuery({
  queryKey: ['events'],
  queryFn: fetchEvents,
  onError: (error) => {
    toast.error(error.message);
    logger.error('Failed to fetch events', error);
  }
});
```

## データベース設計パターン

### インデックス戦略
```sql
-- 検索性能向上
CREATE INDEX idx_events_start_datetime ON events(start_datetime);
CREATE INDEX idx_events_is_active ON events(is_active);
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- 複合インデックス
CREATE INDEX idx_events_active_datetime ON events(is_active, start_datetime);
```

### Prismaスキーマパターン
```prisma
model Event {
  id            Int       @id @default(autoincrement())
  title         String    @db.VarChar(255)
  description   String?   @db.Text
  startDatetime DateTime  @map("start_datetime") @db.Timestamptz
  endDatetime   DateTime? @map("end_datetime") @db.Timestamptz
  location      String?   @db.VarChar(255)
  venueType     VenueType @map("venue_type")
  siteUrl       String?   @map("site_url") @db.VarChar(500)
  imageUrl      String?   @map("image_url") @db.VarChar(500)
  tags          String[]
  isActive      Boolean   @default(true) @map("is_active")
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  
  comments Comment[]
  
  @@map("events")
}
```

## カウントダウン実装パターン

### リアルタイム更新
```typescript
export const useCountdown = (targetDate: Date) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  
  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = targetDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    
    return () => clearInterval(timer);
  }, [targetDate]);
  
  return timeLeft;
};
```

### 緊急度による色分け
```typescript
export const getUrgencyColor = (timeLeft: TimeLeft | null): string => {
  if (!timeLeft) return 'text-gray-500';
  
  const totalHours = timeLeft.days * 24 + timeLeft.hours;
  
  if (totalHours <= 24) return 'text-red-500';      // 24時間以内
  if (totalHours <= 72) return 'text-orange-500';   // 3日以内
  if (totalHours <= 168) return 'text-yellow-500';  // 7日以内
  return 'text-blue-500';                            // 7日以上
};
```

## 認証システム設計パターン

### 現在の実装（自前JWT認証）
```typescript
// JWT認証ミドルウェア
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
  (req as any).user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  next();
};
```

### IDプロバイダー移行対応設計

#### AWS Cognito 移行パターン
```typescript
// JWT検証をCognito JWKSに変更
import { CognitoJwtVerifier } from "aws-jwt-verify";

const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.COGNITO_USER_POOL_ID!,
  tokenUse: "access",
  clientId: process.env.COGNITO_CLIENT_ID!,
});

export const cognitoAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const payload = await verifier.verify(token);
    
    // 既存のユーザーテーブルと同期
    let user = await prisma.user.findUnique({ where: { email: payload.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: payload.sub,
          email: payload.email,
          username: payload.preferred_username || payload.email,
          display_name: payload.name
        }
      });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '認証に失敗しました' });
  }
};
```

#### Firebase Authentication 移行パターン
```typescript
import admin from 'firebase-admin';

export const firebaseAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 既存のユーザーテーブルと同期
    let user = await prisma.user.findUnique({ where: { id: decodedToken.uid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decodedToken.uid,
          email: decodedToken.email,
          username: decodedToken.email?.split('@')[0] || 'user',
          display_name: decodedToken.name
        }
      });
    }
    
    (req as any).user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: '認証に失敗しました' });
  }
};
```

#### フロントエンド認証抽象化パターン
```typescript
// 認証プロバイダー抽象化
interface AuthProvider {
  login(email: string, password: string): Promise<User>;
  register(userData: RegisterData): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  getToken(): Promise<string | null>;
}

// 自前JWT実装
class JWTAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const { user, token } = await response.json();
    localStorage.setItem('token', token);
    return user;
  }
}

// Cognito実装
class CognitoAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<User> {
    const user = await Auth.signIn(email, password);
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();
    return this.syncUserWithDatabase(user, token);
  }
}

// Firebase実装
class FirebaseAuthProvider implements AuthProvider {
  async login(email: string, password: string): Promise<User> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const token = await credential.user.getIdToken();
    return this.syncUserWithDatabase(credential.user, token);
  }
}
```

### 移行戦略

#### フェーズ1: 抽象化層導入
```typescript
// AuthContext を抽象化
const authProvider = process.env.REACT_APP_AUTH_PROVIDER === 'cognito' 
  ? new CognitoAuthProvider()
  : new JWTAuthProvider();

export const AuthProvider: React.FC = ({ children }) => {
  // 共通ロジック
  return <AuthContext.Provider value={authProvider}>{children}</AuthContext.Provider>;
};
```

#### フェーズ2: バックエンド認証切り替え
```typescript
// 環境変数による切り替え
const authMiddleware = process.env.AUTH_PROVIDER === 'cognito' 
  ? cognitoAuth 
  : process.env.AUTH_PROVIDER === 'firebase'
  ? firebaseAuth
  : authenticateToken;

router.post('/events', authMiddleware, createEvent);
```

#### フェーズ3: データベース移行
```typescript
// 既存ユーザーの移行スクリプト
async function migrateUsersToCognito() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    try {
      // Cognitoにユーザー作成
      const cognitoUser = await cognito.adminCreateUser({
        UserPoolId: process.env.COGNITO_USER_POOL_ID,
        Username: user.email,
        TemporaryPassword: generateTempPassword(),
        MessageAction: 'SUPPRESS'
      }).promise();
      
      // IDをCognito UUIDに更新
      await prisma.user.update({
        where: { id: user.id },
        data: { id: cognitoUser.User?.Username }
      });
    } catch (error) {
      console.error(`Failed to migrate user ${user.email}:`, error);
    }
  }
}
```

### クラウドプラットフォーム対応

#### AWS対応
```dockerfile
# ECS/Fargate デプロイ
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

#### Google Cloud対応
```yaml
# Cloud Run デプロイ
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: countdown-hub
spec:
  template:
    spec:
      containers:
      - image: gcr.io/PROJECT_ID/countdown-hub
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

#### Azure対応
```yaml
# Azure Container Apps
apiVersion: apps/v1
kind: Deployment
metadata:
  name: countdown-hub
spec:
  template:
    spec:
      containers:
      - name: app
        image: YOUR_REGISTRY/countdown-hub
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: azure-sql-secret
              key: connection-string
```

この設計により、任意のIDプロバイダー・クラウドプラットフォームへの移行が可能です。

## ソーシャルログイン実装パターン

### 現在のソーシャルログイン実装
```typescript
// Passport.js戦略による実装
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: '/api/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  // ユーザー検索・作成・更新ロジック
}));
```

### 対応済みプロバイダー
1. **Google OAuth 2.0** ✅
   - プロフィール情報とメールアドレス取得
   - 既存アカウントとの自動リンク機能
   - アバター画像同期

### 実装予定プロバイダー
2. **GitHub OAuth**
   ```typescript
   passport.use(new GitHubStrategy({
     clientID: process.env.GITHUB_CLIENT_ID!,
     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
     callbackURL: '/api/auth/github/callback'
   }, async (accessToken, refreshToken, profile, done) => {
     // GitHub固有の実装
   }));
   ```

3. **X (Twitter) OAuth**
   ```typescript
   passport.use(new TwitterStrategy({
     consumerKey: process.env.TWITTER_CLIENT_ID!,
     consumerSecret: process.env.TWITTER_CLIENT_SECRET!,
     callbackURL: '/api/auth/twitter/callback'
   }, async (token, tokenSecret, profile, done) => {
     // Twitter固有の実装
   }));
   ```

4. **LINE Login**
   ```typescript
   passport.use(new LineStrategy({
     channelID: process.env.LINE_CHANNEL_ID!,
     channelSecret: process.env.LINE_CHANNEL_SECRET!,
     callbackURL: '/api/auth/line/callback'
   }, async (accessToken, refreshToken, profile, done) => {
     // LINE固有の実装
   }));
   ```

### フロントエンド統合パターン
```typescript
// ソーシャルログインボタンコンポーネント
<SocialLoginButton
  provider="google"
  onLogin={handleSocialLogin}
  disabled={isLoading}
/>

// ユーザープロフィール設定
<UserProfileSettings />
```

### セキュリティ考慮事項
- **CSRF Protection**: ステートパラメータによる検証
- **アカウントリンク**: 既存メールアドレスとの自動関連付け
- **最後のアカウント保護**: パスワードなしユーザーの最後のソーシャルアカウント削除防止
- **スコープ最小化**: 必要最小限の権限要求

### データベース設計
```prisma
model User {
  // 基本情報
  id            String   @id @default(cuid())
  email         String   @unique
  username      String   @unique
  password      String?  // ソーシャルユーザーはnull
  
  // ソーシャルログイン連携
  google_id     String?  @unique
  github_id     String?  @unique
  twitter_id    String?  @unique
  line_id       String?  @unique
  auth_provider String   @default("local")
}
```

## セキュリティパターン

### 入力値検証
```typescript
// Zod使用（推奨）
import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startDatetime: z.string().datetime(),
  endDatetime: z.string().datetime().optional(),
  location: z.string().max(255).optional(),
  venueType: z.enum(['online', 'offline', 'hybrid']),
  siteUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  tags: z.array(z.string()).max(10),
});

// コントローラーでの使用
export const createEvent = async (req: Request, res: Response) => {
  try {
    const validatedData = eventSchema.parse(req.body);
    const event = await eventService.create(validatedData);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    throw error;
  }
};
```

### SQL インジェクション対策
```typescript
// 良い例（Prisma使用）
const events = await prisma.event.findMany({
  where: {
    title: { contains: searchQuery, mode: 'insensitive' },
    isActive: true
  }
});

// 避けるべき例（生SQL）
const events = await prisma.$queryRaw`
  SELECT * FROM events WHERE title LIKE '%${searchQuery}%'
`;
```

## テストパターン

### ユニットテスト
```typescript
// hooks/__tests__/useCountdown.test.ts
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../useCountdown';

describe('useCountdown', () => {
  it('should calculate correct time left', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24); // 1日後
    const { result } = renderHook(() => useCountdown(futureDate));
    
    expect(result.current?.days).toBe(0);
    expect(result.current?.hours).toBe(23);
  });
});
```

### APIテスト
```typescript
// __tests__/api/events.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('Events API', () => {
  it('should create new event', async () => {
    const eventData = {
      title: 'Test Event',
      startDatetime: '2024-12-31T23:59:59Z',
      venueType: 'online'
    };
    
    const response = await request(app)
      .post('/api/events')
      .send(eventData)
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe('Test Event');
  });
});
```

## パフォーマンス最適化パターン

### React最適化
```typescript
// メモ化
const EventCard = React.memo<EventCardProps>(({ event }) => {
  return <div>{event.title}</div>;
});

// useMemo使用
const sortedEvents = useMemo(() => {
  return events.sort((a, b) => 
    new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
  );
}, [events]);

// useCallback使用
const handleEventClick = useCallback((eventId: string) => {
  navigate(`/events/${eventId}`);
}, [navigate]);
```

### React Query最適化
```typescript
// プリフェッチ
const queryClient = useQueryClient();

const prefetchEvent = useCallback((eventId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId),
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
}, [queryClient]);
```

## 避けるべきアンチパターン

### 状態管理
- ❌ 不必要なグローバル状態
- ❌ useEffect内での非同期処理
- ❌ props drilling（3階層以上）

### API設計
- ❌ 非RESTfulなエンドポイント
- ❌ レスポンスの一貫性のなさ
- ❌ 適切でないHTTPステータスコード

### パフォーマンス
- ❌ 無制限なuseEffect依存配列
- ❌ インラインオブジェクト/関数の props
- ❌ 不要な再レンダリング

この知見は開発中に蓄積し、新機能実装時の参考として活用します。