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