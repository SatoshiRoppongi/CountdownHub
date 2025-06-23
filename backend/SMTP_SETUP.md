# SMTP設定ガイド

本番環境でのメール送信機能を有効にするために、以下の環境変数を設定してください。

## 必要な環境変数

### Gmail SMTP設定の場合

```bash
# SMTP設定
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# メール送信者・受信者設定
FROM_EMAIL=noreply@countdownhub.jp
ADMIN_EMAIL=satoshiroppongi@gmail.com
```

## Gmail App Passwordの取得方法

1. **Googleアカウントの2段階認証を有効にする**
   - [Google Account Security](https://myaccount.google.com/security)にアクセス
   - 2段階認証プロセスを設定

2. **App Passwordを生成する**
   - [App Passwords](https://myaccount.google.com/apppasswords)にアクセス
   - アプリを選択：「Mail」
   - デバイスを選択：「Other (Custom name)」
   - 名前を入力：「CountdownHub Production」
   - 生成されたパスワードを`SMTP_PASS`に設定

## 他のSMTPサービス

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```bash
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-mailgun-smtp-username
SMTP_PASS=your-mailgun-smtp-password
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
```

## 本番環境での設定確認

本番環境にデプロイ後、以下の方法でSMTP設定を確認できます：

1. **ログで設定確認**
   ```
   📧 [本番環境] SMTP設定確認: { host: '設定済み', user: '設定済み', pass: '設定済み' }
   ```

2. **お問い合わせフォームでテスト**
   - 実際にお問い合わせを送信
   - ログで送信結果を確認

## 環境変数が設定されていない場合

SMTP環境変数が不足している場合：
- メール送信はスキップされます
- お問い合わせの保存は正常に動作します
- ログに設定不足の警告が表示されます

```
⚠️ [本番環境] SMTP環境変数が不足しています。メール送信を無効化します。
📧 [本番環境] SMTP設定が不完全のため、メール送信をスキップ
```

## セキュリティ上の注意

- **App Passwordは秘匿情報**です。Gitにコミットしないよう注意してください
- 本番環境の環境変数管理ツール（Render、Vercel、AWS等）を使用してください
- 定期的にApp Passwordを更新することを推奨します