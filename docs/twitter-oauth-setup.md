# X(Twitter) OAuth 設定ガイド

## 概要
CountdownHubでX(Twitter)ログイン機能を有効にするための設定手順です。

## 前提条件
- X(Twitter) Developer Account（開発者アカウント）が必要
- プロジェクトの基本設定が完了していること

## Step 1: Twitter Developer Portal での設定

### 1.1 開発者ポータルへのアクセス
1. [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard) にアクセス
2. Twitterアカウントでログイン
3. 開発者アカウントの申請（まだの場合）

### 1.2 新しいアプリの作成
1. **Projects & Apps** → **+ Create App** をクリック
2. アプリ情報を入力：
   - **App name**: `CountdownHub` (または任意の名前)
   - **Description**: イベントカウントダウンアプリケーション
   - **Website URL**: `https://www.countdownhub.jp`（本番環境の場合）

### 1.3 App permissions の設定
1. 作成したアプリの **Settings** タブを開く
2. **App permissions** セクションで **Edit** をクリック
3. **Read and write** を選択
4. **Request email from users** にチェック ✅
5. **Save** をクリック

### 1.4 Authentication settings の設定
1. **Settings** タブの **Authentication settings** で **Edit** をクリック
2. **Enable 3-legged OAuth** を有効化 ✅
3. **Request email from users** にチェック ✅
4. **Callback URLs** を設定：
   - 開発環境: `http://localhost:3001/api/auth/twitter/callback`
   - 本番環境: `https://api.countdownhub.jp/api/auth/twitter/callback`
5. **Website URL**: 
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://www.countdownhub.jp`
6. **Save** をクリック

### 1.5 API Keys の取得
1. **Keys and tokens** タブを開く
2. **Consumer Keys** セクションで **Regenerate** をクリック（初回は Generate）
3. 以下の情報をコピー：
   - **API Key** (Consumer Key)
   - **API Key Secret** (Consumer Secret)

⚠️ **重要**: これらのキーは一度しか表示されないため、安全な場所に保存してください。

## Step 2: 環境変数の設定

### 2.1 開発環境 (.env)
```bash
# Twitter OAuth設定
TWITTER_CONSUMER_KEY=your-api-key-here
TWITTER_CONSUMER_SECRET=your-api-secret-here
TWITTER_CALLBACK_URL=http://localhost:3001/api/auth/twitter/callback
```

### 2.2 本番環境
本番環境のデプロイ先で以下の環境変数を設定：
```bash
TWITTER_CONSUMER_KEY=your-api-key-here
TWITTER_CONSUMER_SECRET=your-api-secret-here
TWITTER_CALLBACK_URL=https://api.countdownhub.jp/api/auth/twitter/callback
```

## Step 3: 動作確認

### 3.1 設定状況の確認
```bash
curl http://localhost:3001/api/auth/oauth-status
```

レスポンス例：
```json
{
  "twitter": {
    "configured": true,
    "consumerKey": "your-key",
    "consumerSecret": "***configured***",
    "callbackUrl": "http://localhost:3001/api/auth/twitter/callback",
    "message": "Twitter OAuth is properly configured"
  }
}
```

### 3.2 ログインテスト
1. アプリケーションを起動：
   ```bash
   docker-compose up -d
   ```

2. ブラウザで `http://localhost:3000` にアクセス
3. **ログイン** → **X (Twitter)でログイン** をクリック
4. Twitter認証画面で許可
5. 自動的にアプリケーションにリダイレクトされることを確認

## トラブルシューティング

### よくある問題

#### 1. "OAuth signature verification failed"
**原因**: Consumer KeyまたはSecretが間違っている
**解決策**: Twitter Developer Portalで正しいキーを再確認

#### 2. "Invalid callback URL"
**原因**: Twitterアプリの設定でCallback URLが正しく設定されていない
**解決策**: Developer Portalで正確なCallback URLを設定

#### 3. "Email not provided"
**原因**: Twitterアプリでメール取得権限が有効になっていない
**解決策**: App permissionsで "Request email from users" を有効化

#### 4. ログイン後にエラーページが表示される
**原因**: フロントエンドのリダイレクト設定に問題
**解決策**: `FRONTEND_URL` 環境変数が正しく設定されているか確認

### デバッグ方法

#### 1. バックエンドログの確認
```bash
docker-compose logs backend | grep -i twitter
```

#### 2. 設定の詳細確認
```bash
curl http://localhost:3001/api/auth/oauth-status | jq .twitter
```

#### 3. 認証フローのテスト
```bash
# 認証URL確認
echo "認証URL: http://localhost:3001/api/auth/twitter"
```

## セキュリティ考慮事項

1. **Consumer Secret の管理**
   - 絶対にpublicリポジトリにコミットしない
   - 本番環境では環境変数管理ツールを使用

2. **Callback URL の検証**
   - 本番環境では HTTPS のみを使用
   - 正確なドメイン名を指定

3. **権限の最小化**
   - 必要最小限の権限のみを要求
   - 定期的にアクセス権限を見直し

## 参考リンク

- [Twitter Developer Documentation](https://developer.twitter.com/en/docs)
- [Twitter OAuth 1.0a Guide](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)
- [Twitter API v2 Migration Guide](https://developer.twitter.com/en/docs/twitter-api/migrate)