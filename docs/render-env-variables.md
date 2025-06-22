# Render Environment Variables Configuration

## Required Environment Variables for Production

以下の環境変数をRenderの管理画面で設定してください：

### 基本設定
```
NODE_ENV=production
PORT=10000
JWT_SECRET=your-super-secure-jwt-secret-for-production
```

### データベース
```
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```

### Google OAuth
```
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_CALLBACK_URL=https://api.countdownhub.jp/api/auth/google/callback
```

### フロントエンド設定
```
FRONTEND_URL=https://countdownhub.jp
```

### Firebase (オプション)
```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

## Google OAuth Console Settings

Google Cloud Console (console.cloud.google.com) で以下を設定：

### 承認済みのJavaScriptの生成元
- `https://countdownhub.jp`
- `http://localhost:3000` (開発用)

### 承認済みのリダイレクトURI
- `https://api.countdownhub.jp/api/auth/google/callback`
- `http://localhost:3001/api/auth/google/callback` (開発用)

## 設定確認方法

環境変数が正しく設定されているかは以下のエンドポイントで確認できます：
```
GET https://api.countdownhub.jp/api/auth/oauth-status
```

正常な場合のレスポンス例：
```json
{
  "google": {
    "configured": true,
    "clientId": "1330786842..."
  },
  "firebase": {
    "configured": true
  }
}
```