import nodemailer from 'nodemailer';
import { ContactCategory } from '@prisma/client';

interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  category: ContactCategory;
  message: string;
  contactId: number;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 開発環境では Ethereal Email (テスト用) を使用
    // 本番環境では実際のSMTPサーバーを使用
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // 開発環境用のテスト設定（実際にメールは送信されない）
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'ethereal.user@ethereal.email',
          pass: 'ethereal.pass',
        },
      });
    }
  }

  private getCategoryLabel(category: ContactCategory): string {
    const labels = {
      general: '一般的な質問',
      technical: '技術的な問題',
      bug: '不具合報告',
      feature: '機能追加要望',
      account: 'アカウントに関する問題',
      other: 'その他'
    };
    return labels[category] || 'その他';
  }

  async sendContactNotification(data: ContactEmailData): Promise<void> {
    try {
      const categoryLabel = this.getCategoryLabel(data.category);
      
      // 管理者への通知メール
      const adminMailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@countdownhub.jp',
        to: process.env.ADMIN_EMAIL || 'satoshiroppongi@gmail.com',
        subject: `[CountdownHub] 新しいお問い合わせ: ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              新しいお問い合わせが届きました
            </h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">お問い合わせ情報</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">ID:</td>
                  <td style="padding: 8px 0;">#${data.contactId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">お名前:</td>
                  <td style="padding: 8px 0;">${data.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">メールアドレス:</td>
                  <td style="padding: 8px 0;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">件名:</td>
                  <td style="padding: 8px 0;">${data.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">カテゴリ:</td>
                  <td style="padding: 8px 0;">${categoryLabel}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: white; padding: 20px; border: 1px solid #dee2e6; border-radius: 5px;">
              <h3 style="color: #495057; margin-top: 0;">お問い合わせ内容</h3>
              <div style="white-space: pre-wrap; line-height: 1.6;">${data.message}</div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                このメールは CountdownHub のお問い合わせフォームから自動送信されています。
              </p>
            </div>
          </div>
        `
      };

      // ユーザーへの自動返信メール
      const userMailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@countdownhub.jp',
        to: data.email,
        subject: `[CountdownHub] お問い合わせを受け付けました - ${data.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
              お問い合わせありがとうございます
            </h2>
            
            <p>
              ${data.name} 様
            </p>
            
            <p>
              この度は CountdownHub へお問い合わせいただき、ありがとうございます。<br>
              以下の内容でお問い合わせを受け付けいたしました。
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #495057; margin-top: 0;">受け付け内容</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; width: 120px;">お問い合わせID:</td>
                  <td style="padding: 8px 0;">#${data.contactId}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">件名:</td>
                  <td style="padding: 8px 0;">${data.subject}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">カテゴリ:</td>
                  <td style="padding: 8px 0;">${categoryLabel}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold;">受付日時:</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleString('ja-JP')}</td>
                </tr>
              </table>
            </div>
            
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #0c5460; margin-top: 0;">今後の流れについて</h4>
              <ul style="color: #0c5460; margin-bottom: 0;">
                <li>内容を確認の上、担当者より返信いたします</li>
                <li>返信までに数日お時間をいただく場合があります</li>
                <li>緊急の場合は、再度お問い合わせください</li>
              </ul>
            </div>
            
            <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px; text-align: center;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                このメールは自動送信されています。返信はできませんのでご了承ください。<br>
                © ${new Date().getFullYear()} CountdownHub. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      // 環境に応じたメール送信
      if (process.env.NODE_ENV === 'development') {
        // 開発環境でもメール送信をテストする場合
        if (process.env.ENABLE_EMAIL_IN_DEV === 'true') {
          try {
            await Promise.all([
              this.transporter.sendMail(adminMailOptions),
              this.transporter.sendMail(userMailOptions)
            ]);
            
            console.log('📧 [開発環境] メール送信完了:', {
              contactId: data.contactId,
              adminEmail: adminMailOptions.to,
              userEmail: userMailOptions.to
            });
          } catch (emailError) {
            console.error('📧 [開発環境] メール送信エラー:', emailError);
            // 開発環境ではメール送信エラーでも処理を続行
          }
        } else {
          // 開発環境ではログのみ
          console.log('📧 [開発環境] 管理者通知メール:', {
            to: adminMailOptions.to,
            subject: adminMailOptions.subject,
            contactId: data.contactId
          });
          console.log('📧 [開発環境] ユーザー自動返信メール:', {
            to: userMailOptions.to,
            subject: userMailOptions.subject,
            contactId: data.contactId
          });
          console.log('💡 [開発環境] 実際にメールを送信するには ENABLE_EMAIL_IN_DEV=true を設定してください');
        }
      } else {
        // 本番環境では実際にメール送信
        await Promise.all([
          this.transporter.sendMail(adminMailOptions),
          this.transporter.sendMail(userMailOptions)
        ]);
        
        console.log('📧 メール送信完了:', {
          contactId: data.contactId,
          adminEmail: adminMailOptions.to,
          userEmail: userMailOptions.to
        });
      }
    } catch (error) {
      console.error('📧 メール送信エラー:', error);
      // メール送信エラーでもお問い合わせ保存は成功とする
      throw new Error('メール送信に失敗しましたが、お問い合わせは正常に受け付けられました。');
    }
  }
}

export const emailService = new EmailService();