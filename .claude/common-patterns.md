# CountdownHub - 頻用コマンドパターン

## 開発環境操作

### プロジェクト起動・停止
```bash
# 開発サーバー起動（フロント・バック同時）
npm run dev

# フロントエンドのみ起動
npm run dev:frontend

# バックエンドのみ起動  
npm run dev:backend

# Docker環境起動
npm run docker:up

# Docker環境停止
npm run docker:down
```

### 依存関係管理
```bash
# 全依存関係インストール
npm run install:all

# フロントエンド依存関係追加
cd frontend && npm install <package-name>

# バックエンド依存関係追加
cd backend && npm install <package-name>

# 開発依存関係追加
cd frontend && npm install -D <package-name>
cd backend && npm install -D <package-name>
```

## データベース操作

### 基本的なデータベース操作
```bash
# Prismaクライアント生成
npm run db:generate

# マイグレーション実行
npm run db:migrate

# Prisma Studio起動（データベースGUI）
npm run db:studio

# マイグレーションリセット（開発環境のみ）
cd backend && npx prisma migrate reset
```

### データベース操作（開発時）
```bash
# 本番環境用マイグレーション作成
cd backend && npx prisma migrate deploy

# スキーマ差分確認
cd backend && npx prisma db diff

# データベースからスキーマ生成
cd backend && npx prisma db pull
```

## ビルド・デプロイ

### ビルドコマンド
```bash
# 全体ビルド
npm run build

# フロントエンドビルド
npm run build:frontend

# バックエンドビルド
npm run build:backend

# 本番起動
npm start
```

### テスト実行
```bash
# フロントエンドテスト
cd frontend && npm test

# バックエンドテスト
cd backend && npm test

# テストカバレッジ確認
cd frontend && npm run test:coverage
cd backend && npm run test:coverage
```

## Git操作パターン

### ブランチ管理
```bash
# 機能ブランチ作成・切り替え
git checkout -b feature/feature-name

# 開発ブランチに切り替え
git checkout develop

# ブランチ一覧確認
git branch -a

# リモートブランチ更新
git fetch origin

# ブランチマージ
git checkout develop
git merge feature/feature-name
```

### コミット・プッシュ
```bash
# 変更状況確認
git status

# ファイル追加
git add .

# コミット（Claude Codeでの推奨形式）
git commit -m "feature: add countdown component

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# プッシュ
git push origin feature/feature-name
```

## ログ・デバッグ

### ログ確認
```bash
# Dockerコンテナログ確認
docker-compose logs -f

# 特定サービスのログ
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db

# ログファイル確認（開発時）
tail -f backend/logs/app.log
```

### デバッグ情報取得
```bash
# Node.js プロセス確認
ps aux | grep node

# ポート使用状況確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# Docker コンテナ状況確認
docker ps
docker-compose ps
```

## トラブルシューティング

### よくある問題の解決
```bash
# ポート衝突の解決
# 3000番ポートのプロセス終了
lsof -ti:3000 | xargs kill -9

# node_modules再インストール
rm -rf node_modules package-lock.json
npm install

# Docker環境リセット
docker-compose down -v
docker-compose up -d
```

### パフォーマンス確認
```bash
# Node.js メモリ使用量確認
node --max-old-space-size=4096 --inspect backend/dist/index.js

# バンドルサイズ分析（フロントエンド）
cd frontend && npm run analyze

# Lighthouse パフォーマンス測定
npx lighthouse http://localhost:3000 --output html
```

## コード生成・自動化

### Prismaコード生成
```bash
# モデル変更後の一連の作業
cd backend && npx prisma generate
cd backend && npx prisma migrate dev --name "migration-name"
npm run db:generate
```

### 型定義生成
```bash
# OpenAPI仕様から型生成（必要に応じて）
npx openapi-typescript schema.yaml --output types/api.ts

# GraphQL型生成（将来的に使用する場合）
npx graphql-codegen --config codegen.yml
```

## 環境変数管理

### 環境変数設定パターン
```bash
# 環境変数コピー
cp .env.example .env

# 環境別設定確認
echo $NODE_ENV
echo $DATABASE_URL
echo $REACT_APP_API_URL

# Docker環境での環境変数確認
docker-compose exec backend env
docker-compose exec frontend env
```

## リンター・フォーマッター

### コード品質チェック
```bash
# ESLint実行
cd frontend && npm run lint
cd backend && npm run lint

# Prettier実行
cd frontend && npm run format
cd backend && npm run format

# 型チェック
cd frontend && npm run type-check
cd backend && npm run type-check
```

### 自動修正
```bash
# ESLint自動修正
cd frontend && npm run lint:fix
cd backend && npm run lint:fix

# 全自動フォーマット
cd frontend && npm run format:fix
cd backend && npm run format:fix
```

## パッケージ管理

### 依存関係更新
```bash
# 古い依存関係確認
npm outdated

# 依存関係更新
npm update

# セキュリティ脆弱性確認
npm audit

# セキュリティ脆弱性修正
npm audit fix
```

### パッケージ情報確認
```bash
# インストール済みパッケージ一覧
npm list

# 特定パッケージ情報
npm info <package-name>

# パッケージサイズ確認
npx bundlephobia <package-name>
```

## Claude Code実行時の推奨パターン

### 機能実装前チェック
1. `npm run dev` で開発サーバー起動確認
2. `git status` で作業状況確認
3. `npm run db:studio` でデータベース状況確認
4. `.claude/` ディレクトリ内の関連ドキュメント確認

### 実装後チェック
1. `npm run lint` でコード品質確認
2. `npm run type-check` で型エラー確認
3. `npm run test` でテスト実行
4. `git diff` で変更内容確認

### 新機能実装時のワークフロー
```bash
# 1. ブランチ作成
git checkout -b feature/new-feature

# 2. 開発環境起動
npm run dev

# 3. 実装後の品質チェック
npm run lint
npm run type-check
npm run test

# 4. データベース更新（必要時）
npm run db:migrate

# 5. コミット・プッシュ
git add .
git commit -m "feature: implement new feature"
git push origin feature/new-feature
```

このパターン集は開発効率を向上させるため、Claude Codeでの作業時に頻繁に参照してください。