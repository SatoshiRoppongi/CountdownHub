# Google OAuth セットアップガイド

CountdownHub の Google OAuth 機能を有効にするためのセットアップ手順です。

## 🚀 概要

Google OAuth 実装は **完全に実装済み** です。必要なのは Google Cloud Console での設定のみです。

## 📋 必要な作業

### 1. Google Cloud Console セットアップ

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/

2. **新しいプロジェクトを作成**
   - プロジェクト名: `CountdownHub` (またはお好みの名前)

3. **Google+ API を有効化**
   - 左サイドバー: APIs & Services > Library
   - "Google+ API" を検索してクリック
   - "ENABLE" をクリック

4. **OAuth 同意画面を設定**
   - APIs & Services > OAuth consent screen
   - User Type: External を選択
   - 必須情報を入力:
     - Application name: CountdownHub
     - User support email: あなたのメールアドレス
     - Developer contact information: あなたのメールアドレス

5. **OAuth 2.0 クライアント ID を作成**
   - APIs & Services > Credentials
   - "+ CREATE CREDENTIALS" > OAuth client ID
   - Application type: Web application
   - Name: CountdownHub Web Client
   - Authorized redirect URIs に追加:
     - `http://localhost:3001/api/auth/google/callback`
     - (本番環境では適切なドメインに変更)

6. **クライアント ID とシークレットを取得**
   - 作成後に表示される Client ID と Client Secret をメモ

### 2. 環境変数の設定

**backend/.env ファイルを更新:**

```bash
# 既存の設定...
DATABASE_URL="postgresql://countdown_user:countdown_pass@localhost:5432/countdown_hub"
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DEVELOPMENT_MODE=true

# Google OAuth設定 (以下を実際の値に置き換え)
GOOGLE_CLIENT_ID=YOUR_ACTUAL_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_ACTUAL_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# フロントエンドURL
FRONTEND_URL=http://localhost:3000
```

**frontend/.env ファイルを更新:**

```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_GOOGLE_CLIENT_ID=YOUR_ACTUAL_GOOGLE_CLIENT_ID
```

### 3. テスト手順

1. **Docker 環境を再起動**
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. **フロントエンドにアクセス**
   - http://localhost:3000

3. **Google OAuth をテスト**
   - 右上の「ログイン」ボタンをクリック
   - 「Googleでログイン」ボタンをクリック
   - Google 認証画面に正しくリダイレクトされることを確認
   - 認証後、アプリに戻ってログイン状態になることを確認

## 🔧 実装済み機能

### ✅ 完全実装済み

- **バックエンド OAuth フロー**: Passport.js による Google OAuth 戦略
- **データベーススキーマ**: Google ID、プロバイダー情報を含むユーザーテーブル
- **アカウント連携**: 既存メールアドレスとの自動連携
- **JWT トークン生成**: 認証後の自動トークン発行
- **フロントエンド UI**: Google ログインボタンとコールバック処理
- **エラーハンドリング**: 包括的なエラー処理とユーザーフィードバック
- **セキュリティ**: 適切な認証・認可フロー

### 🎯 動作フロー

1. ユーザーが「Googleでログイン」をクリック
2. `/api/auth/google` にリダイレクト
3. Google 認証画面で認証
4. `/api/auth/google/callback` で認証結果を受け取り
5. ユーザー情報の取得・作成・更新
6. JWT トークン生成
7. フロントエンドの `/auth/callback` にリダイレクト
8. トークンをローカルストレージに保存
9. ユーザー情報を取得してログイン完了

## 🛠️ トラブルシューティング

### よくある問題

1. **"redirect_uri_mismatch" エラー**
   - Google Cloud Console の Authorized redirect URIs を確認
   - `http://localhost:3001/api/auth/google/callback` が正確に設定されているか確認

2. **環境変数が読み込まれない**
   - Docker コンテナを再起動: `docker-compose restart`
   - `.env` ファイルの構文を確認

3. **認証後にエラーが発生**
   - バックエンドログを確認: `docker-compose logs backend`
   - データベース接続を確認: `docker-compose logs db`

### デバッグコマンド

```bash
# バックエンドログを確認
docker-compose logs -f backend

# データベース接続テスト
docker-compose exec backend npx prisma studio

# 環境変数を確認
docker-compose exec backend env | grep GOOGLE
```

## 🔒 セキュリティ注意事項

- **本番環境では:**
  - JWT_SECRET を強力なランダム文字列に変更
  - HTTPS を使用
  - 適切なドメインでリダイレクト URI を設定
  - 環境変数を適切に保護

## 📞 サポート

設定でお困りの場合は、以下の情報を含めてお知らせください：

1. エラーメッセージ
2. ブラウザの開発者ツールのコンソールログ
3. バックエンドのログ (`docker-compose logs backend`)
4. 使用している環境 (OS、ブラウザなど)