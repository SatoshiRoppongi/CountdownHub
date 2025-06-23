# CountdownHub - イベントカウントダウンサイト

日本全国のイベントをカウントダウン形式で表示するWebサービスです。

https://www.countdownhub.jp/

## 🚀 クイックスタート

### 前提条件
- Node.js 18以上
- Docker & Docker Compose
- Git

### セットアップ

1. **リポジトリのクローン**
```bash
git clone <repository-url>
cd CountdownHub
```

2. **自動セットアップの実行**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **開発サーバーの起動**
```bash
npm run dev
```

4. **アクセス**
- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:3001
- Prisma Studio: `npm run db:studio`

## 📁 プロジェクト構造

```
CountdownHub/
├── backend/          # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── types/
│   └── prisma/       # データベーススキーマ
├── frontend/         # React + TypeScript + Tailwind
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── services/
├── scripts/          # セットアップスクリプト
└── docs/            # ドキュメント
```

## 🛠️ 主要技術

### フロントエンド
- React 18 + TypeScript
- Tailwind CSS
- React Router
- React Query
- Axios

### バックエンド
- Node.js + Express
- TypeScript
- PostgreSQL
- Prisma ORM

### 開発環境
- Docker & Docker Compose
- ESLint & Prettier

## 📋 利用可能なスクリプト

### ルートディレクトリ
```bash
npm run dev              # フロントエンド・バックエンド同時起動
npm run build            # 本番ビルド
npm run docker:up        # Docker環境起動
npm run docker:down      # Docker環境停止
npm run install:all      # 全依存関係インストール
```

### データベース操作
```bash
npm run db:migrate       # マイグレーション実行
npm run db:generate      # Prismaクライアント生成
npm run db:studio        # Prisma Studio起動
```

## 🎯 主要機能

### MVP機能
- [x] イベント一覧表示（カウントダウン付き）
- [x] イベント詳細ページ
- [x] 検索・フィルタリング機能
- [x] コメント機能
- [x] イベント登録機能
- [x] 管理者画面
- [x] CSV一括登録

### カウントダウン表示
- リアルタイム更新（1秒間隔）
- 残り時間による視覚的優先度
- 色分け表示（緊急度別）

### レスポンシブデザイン
- モバイルファースト設計
- 320px～対応
- タブレット・デスクトップ最適化

## 🗄️ データベース設計

### Events テーブル
- id, title, description
- start_datetime, end_datetime
- location, venue_type
- site_url, image_url, tags
- is_active, created_at, updated_at

### Comments テーブル
- id, event_id, author_name
- content, is_reported, created_at

## 🔧 開発

### 環境変数
```env
# データベース
DATABASE_URL="postgresql://countdown_user:countdown_pass@localhost:5432/countdown_hub"

# バックエンド
NODE_ENV=development
PORT=3001

# フロントエンド
REACT_APP_API_URL=http://localhost:3001
```

### Docker開発
```bash
# データベースのみ起動
docker-compose up -d db

# 全サービス起動
docker-compose up -d

# ログ確認
docker-compose logs -f
```

## 📈 今後の拡張予定

- [ ] ユーザー認証機能
- [ ] お気に入り機能
- [ ] 通知機能
- [ ] ソーシャル共有
- [ ] 外部API連携
- [ ] PWA対応

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

## 📞 サポート

問題や質問がある場合は、[Issues](https://github.com/your-repo/CountdownHub/issues) で報告してください。
