import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// JWT Strategy (既存の認証)
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'your-secret-key'
}, async (payload, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        is_active: true,
        auth_provider: true
      }
    });

    if (user && user.is_active) {
      return done(null, user);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy (環境変数が設定されている場合のみ)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // 既存のGoogleユーザーをチェック
    let user = await prisma.user.findUnique({
      where: { google_id: profile.id }
    });

    if (user) {
      // 既存ユーザーの場合、アバターのみ更新（display_nameは既存の値を保持）
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          avatar_url: profile.photos?.[0]?.value,
          updated_at: new Date()
        }
      });
      return done(null, user);
    }

    // メールアドレスでの既存ユーザーチェック
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: profile.emails?.[0]?.value }
    });

    if (existingEmailUser) {
      // 既存のメールアドレスのユーザーにGoogleアカウントをリンク
      user = await prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          google_id: profile.id,
          // display_nameは既存の値を保持（Googleの名前で上書きしない）
          display_name: existingEmailUser.display_name || profile.displayName,
          avatar_url: profile.photos?.[0]?.value || existingEmailUser.avatar_url,
          auth_provider: 'google',
          updated_at: new Date()
        }
      });
      return done(null, user);
    }

    // 新規ユーザー作成
    const email = profile.emails?.[0]?.value;
    if (!email) {
      return done(new Error('Google アカウントにメールアドレスが設定されていません'), false);
    }

    // ユニークなユーザー名を生成
    let username = email.split('@')[0];
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${email.split('@')[0]}_${counter}`;
      counter++;
    }

    // ニックネームの重複チェックとユニークな名前生成
    let displayName = profile.displayName || profile.name?.givenName || username;
    let displayNameCounter = 1;
    while (await prisma.user.findFirst({ where: { display_name: displayName } })) {
      displayName = `${profile.displayName || profile.name?.givenName || username}_${displayNameCounter}`;
      displayNameCounter++;
    }

    // 新規ユーザー作成（一時的にデフォルト名で作成）
    user = await prisma.user.create({
      data: {
        email,
        username,
        display_name: `TempUser${Date.now()}`, // 一時的な名前
        avatar_url: profile.photos?.[0]?.value,
        google_id: profile.id,
        auth_provider: 'google',
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
      finalDisplayName = displayName; // 重複する場合は上記で生成したユニーク名を使用
    }
    
    // ニックネームを更新
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        display_name: finalDisplayName
      }
    });

    return done(null, user);

  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, false);
  }
  }));
}

// Twitter OAuth Strategy (環境変数が設定されている場合のみ)
if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
  try {
    const { Strategy: TwitterStrategy } = require('passport-twitter');
    passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: process.env.TWITTER_CALLBACK_URL || '/api/auth/twitter/callback',
    includeEmail: true // メールアドレスの取得を有効化
  }, async (token: string, tokenSecret: string, profile: any, done: any) => {
    try {
      // 既存のTwitterユーザーをチェック
      let user = await prisma.user.findUnique({
        where: { twitter_id: profile.id }
      });

      if (user) {
        // 既存ユーザーの場合、アバターのみ更新
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            avatar_url: profile.photos?.[0]?.value,
            updated_at: new Date()
          }
        });
        return done(null, user);
      }

      // メールアドレスでの既存ユーザーチェック（Twitterでメールが取得できた場合）
      const email = profile.emails?.[0]?.value;
      if (email) {
        const existingEmailUser = await prisma.user.findUnique({
          where: { email }
        });

        if (existingEmailUser) {
          // 既存のメールアドレスのユーザーにTwitterアカウントをリンク
          user = await prisma.user.update({
            where: { id: existingEmailUser.id },
            data: {
              twitter_id: profile.id,
              display_name: existingEmailUser.display_name || profile.displayName,
              avatar_url: profile.photos?.[0]?.value || existingEmailUser.avatar_url,
              auth_provider: 'twitter',
              updated_at: new Date()
            }
          });
          return done(null, user);
        }
      }

      // 新規ユーザー作成
      // Twitterの場合メールアドレスが取得できない場合があるため、ダミーメールを生成
      const userEmail = email || `${profile.username}@twitter.local`;
      
      // ユニークなユーザー名を生成
      let username = profile.username || profile.displayName?.replace(/\s+/g, '').toLowerCase() || `user${profile.id}`;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${profile.username || profile.displayName?.replace(/\s+/g, '').toLowerCase() || `user${profile.id}`}_${counter}`;
        counter++;
      }

      // 新規ユーザー作成（一時的にデフォルト名で作成）
      user = await prisma.user.create({
        data: {
          email: userEmail,
          username,
          display_name: `TempUser${Date.now()}`, // 一時的な名前
          avatar_url: profile.photos?.[0]?.value,
          twitter_id: profile.id,
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
        let twitterDisplayName = profile.displayName || username;
        let displayNameCounter = 1;
        while (await prisma.user.findFirst({ where: { display_name: twitterDisplayName } })) {
          twitterDisplayName = `${profile.displayName || username}_${displayNameCounter}`;
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

      return done(null, user);

    } catch (error) {
      console.error('Twitter OAuth error:', error);
      return done(error, false);
    }
  }));
  } catch (error) {
    console.error('Failed to load Twitter OAuth strategy:', error);
  }
}

// シリアライゼーション（セッション使用時に必要だが、今回はJWTなので空実装）
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        is_active: true,
        auth_provider: true
      }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;