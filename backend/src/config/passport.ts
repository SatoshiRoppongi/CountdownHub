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