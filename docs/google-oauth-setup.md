# Google OAuth設定ガイド

## 1. Google Cloud Console設定

### プロジェクト作成・選択
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成するか、既存プロジェクトを選択

### OAuth同意画面の設定
1. **APIs & Services** → **OAuth consent screen** に移動
2. **External** を選択（個人用の場合）
3. 必要な情報を入力：
   - アプリ名: `CountdownHub`
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス

### OAuth 2.0 クライアントIDの作成
1. **APIs & Services** → **認証情報** に移動
2. **認証情報を作成** → **OAuth 2.0 クライアントID** をクリック
3. **ウェブアプリケーション** を選択
4. 名前を入力: `CountdownHub Local Development`
5. **承認済みのJavaScript生成元** に追加:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. **承認済みのリダイレクトURI** に追加:
   - `http://localhost:3001/api/auth/google/callback`

### クライアントIDとシークレットの取得
1. 作成されたクライアントIDをクリック
2. **クライアントID** と **クライアントシークレット** をコピー

## 2. 環境変数の設定

`backend/.env` ファイルに以下を設定：

```env
# Google OAuth設定
GOOGLE_CLIENT_ID=your-actual-google-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# フロントエンドURL
FRONTEND_URL=http://localhost:3000
```

## 3. 本番環境での設定

本番環境では以下のURLに変更：

```env
GOOGLE_CALLBACK_URL=https://your-domain.com/api/auth/google/callback
FRONTEND_URL=https://your-domain.com
```

Google Cloud Consoleの承認済みURIも本番URLに更新する必要があります。

## 4. テスト手順

1. バックエンドとフロントエンドを起動
2. ログインページで「Googleでログイン」をクリック
3. Google認証画面が表示されることを確認
4. 認証後、アプリケーションにリダイレクトされることを確認

## トラブルシューティング

### エラー 401: invalid_client
- クライアントIDが正しく設定されているか確認
- Google Cloud Consoleの承認済みURIが正しいか確認

### リダイレクトURIの不一致
- `.env`ファイルのコールバックURLが正しいか確認
- Google Cloud Consoleの設定と一致しているか確認