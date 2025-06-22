# Google OAuth トラブルシューティング

## エラー 401: invalid_client の解決方法

### 1. Google Cloud Console設定の確認

#### OAuth 2.0 クライアントIDの設定確認
1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **認証情報**
2. 作成したOAuth 2.0 クライアントIDをクリック
3. 以下の設定を確認：

**承認済みのJavaScript生成元**
```
http://localhost:3000
http://localhost:3001
```

**承認済みのリダイレクトURI**
```
http://localhost:3001/api/auth/google/callback
```

### 2. クライアントIDの確認

現在の設定:
- クライアントID: `13307868422-7tnbh3gqfvomqtqse8fpnqmjlvmkl925.apps.googleusercontent.com`

#### 確認手順
1. Google Cloud Consoleで上記のクライアントIDが存在するか確認
2. プロジェクトが正しく選択されているか確認
3. OAuth同意画面が設定されているか確認

### 3. 一般的な解決方法

#### 方法1: 新しいOAuth 2.0 クライアントIDを作成
1. Google Cloud Console → **APIs & Services** → **認証情報**
2. **+ 認証情報を作成** → **OAuth 2.0 クライアントID**
3. **ウェブアプリケーション** を選択
4. 名前: `CountdownHub Development`
5. **承認済みのJavaScript生成元**に追加:
   - `http://localhost:3000`
   - `http://localhost:3001`
6. **承認済みのリダイレクトURI**に追加:
   - `http://localhost:3001/api/auth/google/callback`

#### 方法2: OAuth同意画面の設定
1. **APIs & Services** → **OAuth consent screen**
2. **External** を選択
3. 必須フィールドを入力:
   - アプリ名: `CountdownHub`
   - ユーザーサポートメール: あなたのメールアドレス
   - デベロッパーの連絡先情報: あなたのメールアドレス
4. **保存して次へ**

#### 方法3: プロジェクトの確認
1. Google Cloud Consoleで正しいプロジェクトが選択されているか確認
2. プロジェクトを切り替える場合は、上部のプロジェクト名をクリック

### 4. 設定確認用のURL

ブラウザで以下のURLにアクセスして設定を確認:
```
http://localhost:3001/api/auth/oauth-status
```

期待される応答:
```json
{
  "google": {
    "configured": true,
    "clientId": "13307868422...",
    "callbackUrl": "http://localhost:3001/api/auth/google/callback",
    "message": "Google OAuth is properly configured"
  }
}
```

### 5. デバッグ用の追加情報

#### コンソールログの確認
バックエンドコンソールで以下のようなエラーが表示されていないか確認:
- `Google OAuth error:`
- `Passport authentication error:`

#### ネットワークタブの確認
ブラウザの開発者ツール → ネットワークタブで:
1. `/api/auth/google` へのリクエストが正常に送信されているか
2. Googleへのリダイレクトが正常に行われているか
3. コールバックURLが正しいか

### 6. 最終手段: 完全な再設定

1. Google Cloud Consoleで既存のOAuth 2.0 クライアントIDを削除
2. 新しいプロジェクトを作成
3. OAuth同意画面を最初から設定
4. 新しいOAuth 2.0 クライアントIDを作成
5. `.env`ファイルを新しい認証情報で更新
6. バックエンドサーバーを再起動