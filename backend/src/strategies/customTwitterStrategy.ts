import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// カスタムTwitter OAuth認証戦略
export class CustomTwitterOAuth {
  private consumerKey: string;
  private consumerSecret: string;
  private callbackURL: string;

  constructor(consumerKey: string, consumerSecret: string, callbackURL: string) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.callbackURL = callbackURL;
  }

  // OAuth 1.0a リクエストトークン取得
  async getRequestToken(): Promise<{ oauth_token: string; oauth_token_secret: string; oauth_callback_confirmed: string }> {
    const OAuth = require('oauth').OAuth;
    
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.consumerKey,
      this.consumerSecret,
      '1.0A',
      this.callbackURL,
      'HMAC-SHA1'
    );

    return new Promise((resolve, reject) => {
      oauth.getOAuthRequestToken((error: any, oauth_token: string, oauth_token_secret: string, results: any) => {
        if (error) {
          console.error('Twitter OAuth request token error:', error);
          reject(error);
        } else {
          console.log('✅ Twitter OAuth request token obtained:', { oauth_token: oauth_token.substring(0, 10) + '...' });
          resolve({
            oauth_token,
            oauth_token_secret,
            oauth_callback_confirmed: results.oauth_callback_confirmed
          });
        }
      });
    });
  }

  // OAuth 1.0a アクセストークン取得
  async getAccessToken(oauth_token: string, oauth_token_secret: string, oauth_verifier: string): Promise<any> {
    const OAuth = require('oauth').OAuth;
    
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.consumerKey,
      this.consumerSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );

    return new Promise((resolve, reject) => {
      oauth.getOAuthAccessToken(oauth_token, oauth_token_secret, oauth_verifier, (error: any, oauth_access_token: string, oauth_access_token_secret: string, results: any) => {
        if (error) {
          console.error('Twitter OAuth access token error:', error);
          reject(error);
        } else {
          console.log('✅ Twitter OAuth access token obtained:', { 
            user_id: results.user_id,
            screen_name: results.screen_name 
          });
          resolve({
            oauth_access_token,
            oauth_access_token_secret,
            user_id: results.user_id,
            screen_name: results.screen_name,
            ...results
          });
        }
      });
    });
  }

  // Twitterユーザー情報取得
  async getUserInfo(oauth_access_token: string, oauth_access_token_secret: string): Promise<any> {
    const OAuth = require('oauth').OAuth;
    
    const oauth = new OAuth(
      'https://api.twitter.com/oauth/request_token',
      'https://api.twitter.com/oauth/access_token',
      this.consumerKey,
      this.consumerSecret,
      '1.0A',
      null,
      'HMAC-SHA1'
    );

    return new Promise((resolve, reject) => {
      oauth.get(
        'https://api.twitter.com/1.1/account/verify_credentials.json?include_email=true',
        oauth_access_token,
        oauth_access_token_secret,
        (error: any, data: string) => {
          if (error) {
            console.error('Twitter user info error:', error);
            reject(error);
          } else {
            try {
              const userInfo = JSON.parse(data);
              console.log('✅ Twitter user info obtained:', { 
                id: userInfo.id_str,
                screen_name: userInfo.screen_name,
                name: userInfo.name,
                email: userInfo.email || 'not provided'
              });
              resolve(userInfo);
            } catch (parseError) {
              console.error('Twitter user info parse error:', parseError);
              reject(parseError);
            }
          }
        }
      );
    });
  }

  // データベースでユーザーを作成または更新
  async handleUser(twitterUserInfo: any): Promise<any> {
    try {
      // 既存のTwitterユーザーをチェック
      let user = await prisma.user.findUnique({
        where: { twitter_id: twitterUserInfo.id_str }
      });

      if (user) {
        // 既存ユーザーの場合、アバターのみ更新
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            avatar_url: twitterUserInfo.profile_image_url_https?.replace('_normal', '_400x400'),
            updated_at: new Date()
          }
        });
        return user;
      }

      // メールアドレスでの既存ユーザーチェック（Twitterでメールが取得できた場合）
      const email = twitterUserInfo.email;
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingEmailUser) {
          // 既存のメールアドレスのユーザーにTwitterアカウントをリンク
          user = await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: {
              twitter_id: twitterUserInfo.id_str,
              display_name: existingEmailUser.display_name || twitterUserInfo.name,
              avatar_url: twitterUserInfo.profile_image_url_https?.replace('_normal', '_400x400') || existingEmailUser.avatar_url,
              auth_provider: 'twitter',
              updated_at: new Date()
            }
          });
          return user;
        }
      }

      // 新規ユーザー作成
      // Twitterの場合メールアドレスが取得できない場合があるため、ダミーメールを生成
      const userEmail = email || `${twitterUserInfo.screen_name}@twitter.local`;
      
      // ユニークなユーザー名を生成
      let username = twitterUserInfo.screen_name;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${twitterUserInfo.screen_name}_${counter}`;
        counter++;
      }

      // 新規ユーザー作成（一時的にデフォルト名で作成）
      user = await prisma.user.create({
        data: {
          email: userEmail,
          username,
          display_name: `TempUser${Date.now()}`, // 一時的な名前
          avatar_url: twitterUserInfo.profile_image_url_https?.replace('_normal', '_400x400'),
          twitter_id: twitterUserInfo.id_str,
          auth_provider: 'twitter',
          password: null // ソーシャルログインユーザーはパスワードなし
        }
      });

      // 実際のユーザーIDを使ってデフォルトニックネームを生成
      const defaultDisplayName = `User${user.id.slice(-6)}`;
      
      // 重複チェック
      const duplicateCheck = await prisma.user.findFirst({
        where: { 
          AND: [
            { display_name: defaultDisplayName },
            { id: { not: user.id } }
          ]
        }
      });
      
      let finalDisplayName = defaultDisplayName;
      if (duplicateCheck) {
        // 重複する場合はTwitterの表示名を使用してユニーク名を生成
        let twitterDisplayName = twitterUserInfo.name || username;
        let displayNameCounter = 1;
        while (await prisma.user.findFirst({ where: { display_name: twitterDisplayName } })) {
          twitterDisplayName = `${twitterUserInfo.name || username}_${displayNameCounter}`;
          displayNameCounter++;
        }
        finalDisplayName = twitterDisplayName;
      }
      
      // ニックネームを更新
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          display_name: finalDisplayName
        }
      });

      return user;

    } catch (error) {
      console.error('CustomTwitterOAuth handleUser error:', error);
      throw error;
    }
  }
}

export const customTwitterOAuth = new CustomTwitterOAuth(
  process.env.TWITTER_CONSUMER_KEY!,
  process.env.TWITTER_CONSUMER_SECRET!,
  process.env.TWITTER_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://api.countdownhub.jp/api/auth/twitter/callback' 
      : 'http://localhost:3001/api/auth/twitter/callback')
);