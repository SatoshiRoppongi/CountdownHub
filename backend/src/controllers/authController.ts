import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import passport from '../config/passport';

const prisma = new PrismaClient();

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  username: z.string()
    .min(3, 'ユーザー名は3文字以上で入力してください')
    .max(50, 'ユーザー名は50文字以下で入力してください')
    .regex(/^[a-zA-Z0-9_-]+$/, 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です'),
  password: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100, 'パスワードは100文字以下で入力してください'),
  display_name: z.string()
    .min(1, 'ニックネームを入力してください')
    .max(100, 'ニックネームは100文字以下で入力してください')
    .optional()
});


// プロフィール更新用スキーマ
const updateProfileSchema = z.object({
  display_name: z.string()
    .min(1, 'ニックネームを入力してください')
    .max(100, 'ニックネームは100文字以下で入力してください')
    .optional(),
  bio: z.string()
    .max(500, '自己紹介文は500文字以下で入力してください')
    .optional()
    .nullable()
});

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください')
});

// ユーザー登録
export const register = async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { email, username, password, display_name } = validatedData;

    // ニックネームのデフォルト値を生成（空の場合）
    let finalDisplayName = display_name?.trim();
    if (!finalDisplayName) {
      // 一時的なユーザーIDを生成（実際のIDは作成後に決まるため、タイムスタンプを使用）
      const tempId = Date.now().toString().slice(-6);
      finalDisplayName = `User${tempId}`;
    }

    // 既存ユーザーチェック（email, username, display_name）
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
          { display_name: finalDisplayName }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'このメールアドレスは既に使用されています' });
      } else if (existingUser.username === username) {
        return res.status(400).json({ error: 'このユーザー名は既に使用されています' });
      } else {
        return res.status(400).json({ error: 'このニックネームは既に使用されています。異なるニックネームを設定してください。' });
      }
    }

    // パスワードハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    let user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        display_name: finalDisplayName
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        created_at: true
      }
    });

    // デフォルトニックネームの場合、実際のユーザーIDを使って更新
    if (!display_name?.trim()) {
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
      
      if (!duplicateCheck) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { display_name: defaultDisplayName },
          select: {
            id: true,
            email: true,
            username: true,
            display_name: true,
            created_at: true
          }
        });
      }
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'バリデーションエラー',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'ユーザー登録に失敗しました'
    });
  }
};

// ログイン
export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        password: true,
        is_active: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        error: 'アカウントが無効化されています'
      });
    }

    // パスワード確認
    if (!user.password) {
      return res.status(401).json({
        error: 'このアカウントはソーシャルログイン専用です'
      });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'メールアドレスまたはパスワードが正しくありません'
      });
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // パスワードを除いてレスポンス
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'ログインしました',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'バリデーションエラー',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'ログインに失敗しました'
    });
  }
};

// プロフィール取得
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
        _count: {
          select: {
            events: true,
            comments: true,
            favorites: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    res.json({ user });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'プロフィール取得に失敗しました'
    });
  }
};

// ニックネーム重複チェック
export const checkDisplayNameAvailability = async (req: Request, res: Response) => {
  try {
    const { display_name } = req.query;
    const userId = (req as any).user?.id;

    if (!display_name || typeof display_name !== 'string') {
      return res.status(400).json({ error: 'ニックネームを指定してください' });
    }

    const trimmedDisplayName = display_name.trim();
    
    if (trimmedDisplayName.length === 0) {
      return res.status(400).json({ error: 'ニックネームを入力してください' });
    }

    if (trimmedDisplayName.length > 100) {
      return res.status(400).json({ error: 'ニックネームは100文字以下で入力してください' });
    }

    // 既存ユーザーチェック（自分以外）
    const existingUser = await prisma.user.findFirst({
      where: userId ? {
        AND: [
          { display_name: trimmedDisplayName },
          { id: { not: userId } }
        ]
      } : {
        display_name: trimmedDisplayName
      }
    });

    res.json({
      available: !existingUser,
      message: existingUser 
        ? 'このニックネームは既に使用されています。異なるニックネームを設定してください。'
        : 'このニックネームは使用可能です'
    });

  } catch (error) {
    console.error('Check display name availability error:', error);
    res.status(500).json({
      error: 'ニックネームの確認に失敗しました'
    });
  }
};

// プロフィール更新
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const validatedData = updateProfileSchema.parse(req.body);
    const { display_name, bio } = validatedData;

    const updateData: any = { updated_at: new Date() };

    // ニックネーム更新の場合
    if (display_name !== undefined) {
      const trimmedDisplayName = display_name.trim();

      // ニックネーム重複チェック（自分以外）
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { display_name: trimmedDisplayName },
            { id: { not: userId } }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'このニックネームは既に使用されています。異なるニックネームを設定してください。' 
        });
      }

      updateData.display_name = trimmedDisplayName;
    }

    // 自己紹介文更新の場合
    if (bio !== undefined) {
      updateData.bio = bio ? bio.trim() : null;
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        bio: true,
        created_at: true
      } as any
    });

    // ニックネームが更新された場合、ユーザーのすべてのコメントの表示名も更新
    if (display_name !== undefined) {
      await prisma.comment.updateMany({
        where: { user_id: userId },
        data: {
          author_name: updateData.display_name,
          updated_at: new Date()
        }
      });
    }

    res.json({
      message: 'プロフィールを更新しました',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'バリデーションエラー',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    res.status(500).json({
      error: 'プロフィール更新に失敗しました'
    });
  }
};

// ユーザーのイベント一覧取得
export const getUserEvents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const events = await prisma.event.findMany({
      where: { 
        user_id: userId 
      },
      include: {
        _count: {
          select: { comments: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ events });

  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({
      error: 'イベント取得に失敗しました'
    });
  }
};

// ユーザーのコメント一覧取得
export const getUserComments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const comments = await prisma.comment.findMany({
      where: { 
        user_id: userId 
      },
      include: {
        event: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    res.json({ comments });

  } catch (error) {
    console.error('Get user comments error:', error);
    res.status(500).json({
      error: 'コメント取得に失敗しました'
    });
  }
};

// ログアウト（トークン無効化は実装しないが、フロントエンドでトークンを削除）
export const logout = async (req: Request, res: Response) => {
  res.json({
    message: 'ログアウトしました'
  });
};

// Google OAuth認証開始
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email']
});

// Google OAuth コールバック
export const googleCallback = (req: Request, res: Response, next: Function) => {
  passport.authenticate('google', { session: false }, (err: any, user: any) => {
    // フロントエンドURLを決定（全体で使用）
    const getFrontendUrl = () => {
      return process.env.FRONTEND_URL || 
             (process.env.NODE_ENV === 'production' ? 'https://countdownhub.jp' : 'http://localhost:3000');
    };

    if (err) {
      console.error('Google OAuth callback error:', err);
      return res.redirect(`${getFrontendUrl()}/login?error=oauth_error`);
    }

    if (!user) {
      return res.redirect(`${getFrontendUrl()}/login?error=oauth_failed`);
    }

    try {
      // JWTトークン生成
      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email,
          username: user.username 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      // フロントエンドにリダイレクト（トークンをクエリパラメータで渡す）
      const frontendUrl = getFrontendUrl();
      console.log('OAuth callback - redirecting to:', `${frontendUrl}/auth/callback?token=${token}&provider=google`);
      res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=google`);

    } catch (error) {
      console.error('Token generation error:', error);
      res.redirect(`${getFrontendUrl()}/login?error=token_error`);
    }
  })(req, res, next);
};

// カスタムTwitter OAuth実装をインポート
import { customTwitterOAuth } from '../strategies/customTwitterStrategy';
import { twitterOAuthStore } from '../utils/twitterOAuthStore';

// Twitter OAuth 開始 (カスタム実装)
export const twitterAuth = async (req: Request, res: Response) => {
  try {
    console.log('🐦 Starting custom Twitter OAuth...');
    
    if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) {
      console.error('❌ Twitter OAuth credentials not configured');
      return res.status(500).json({ error: 'Twitter OAuth not configured' });
    }

    // リクエストトークンを取得
    const { oauth_token, oauth_token_secret } = await customTwitterOAuth.getRequestToken();
    
    // カスタムストレージに保存（oauth_tokenをキーとして使用）
    twitterOAuthStore.storeRequestToken(oauth_token, oauth_token_secret);
    
    // 認証URLにリダイレクト（OAuth 1.0aなのでstateパラメータは使用しない）
    const authUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauth_token}`;
    console.log('🔗 Redirecting to Twitter auth URL:', authUrl);
    
    res.redirect(authUrl);
    
  } catch (error) {
    console.error('❌ Custom Twitter OAuth start error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://countdownhub.jp' : 'http://localhost:3000');
    res.redirect(`${frontendUrl}/login?error=twitter_oauth_start_failed`);
  }
};

// Twitter OAuth コールバック (カスタム実装)
export const twitterCallback = async (req: Request, res: Response) => {
  try {
    console.log('🐦 Twitter OAuth callback received:', {
      oauth_token: req.query.oauth_token,
      oauth_verifier: req.query.oauth_verifier,
      denied: req.query.denied
    });

    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://countdownhub.jp' : 'http://localhost:3000');

    // OAuth拒否の場合
    if (req.query.denied) {
      console.log('❌ Twitter OAuth was denied by user');
      return res.redirect(`${frontendUrl}/login?error=oauth_denied`);
    }

    const oauth_token = req.query.oauth_token as string;
    const oauth_verifier = req.query.oauth_verifier as string;

    if (!oauth_token || !oauth_verifier) {
      console.error('❌ Missing OAuth parameters');
      return res.redirect(`${frontendUrl}/login?error=oauth_params_missing`);
    }

    // カスタムストレージからリクエストトークンを取得（oauth_tokenをキーとして使用）
    const requestTokenData = twitterOAuthStore.getRequestToken(oauth_token);
    
    if (!requestTokenData) {
      console.error('❌ Request token not found in custom store for oauth_token:', oauth_token);
      return res.redirect(`${frontendUrl}/login?error=oauth_token_not_found`);
    }

    // アクセストークンを取得
    const accessTokenData = await customTwitterOAuth.getAccessToken(
      requestTokenData.token,
      requestTokenData.tokenSecret,
      oauth_verifier
    );

    // ユーザー情報を取得
    const twitterUserInfo = await customTwitterOAuth.getUserInfo(
      accessTokenData.oauth_access_token,
      accessTokenData.oauth_access_token_secret
    );

    // データベースでユーザーを処理
    const user = await customTwitterOAuth.handleUser(twitterUserInfo);

    // ストレージからリクエストトークンを削除
    twitterOAuthStore.removeRequestToken(oauth_token);

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    // フロントエンドにリダイレクト
    console.log('✅ Custom Twitter OAuth success - redirecting to:', `${frontendUrl}/auth/callback?token=${token}&provider=twitter`);
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&provider=twitter`);

  } catch (error) {
    console.error('❌ Custom Twitter OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 
      (process.env.NODE_ENV === 'production' ? 'https://countdownhub.jp' : 'http://localhost:3000');
    res.redirect(`${frontendUrl}/login?error=oauth_callback_failed`);
  }
};

// ソーシャルログイン用のアカウント連携
export const linkSocialAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { provider, provider_id } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!['google', 'github', 'twitter', 'line'].includes(provider)) {
      return res.status(400).json({ error: '無効なプロバイダーです' });
    }

    // 既に他のユーザーが使用しているかチェック
    const providerField = `${provider}_id`;
    const existingUser = await prisma.user.findFirst({
      where: {
        [providerField]: provider_id,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: `この${provider}アカウントは既に他のユーザーが使用しています` 
      });
    }

    // アカウント連携
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [providerField]: provider_id,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        google_id: true,
        github_id: true,
        twitter_id: true,
        line_id: true,
        auth_provider: true
      }
    });

    res.json({
      message: `${provider}アカウントを連携しました`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Link social account error:', error);
    res.status(500).json({
      error: 'アカウント連携に失敗しました'
    });
  }
};

// ソーシャルログインアカウントの連携解除
export const unlinkSocialAccount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { provider } = req.body;

    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    if (!['google', 'github', 'twitter', 'line'].includes(provider)) {
      return res.status(400).json({ error: '無効なプロバイダーです' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // パスワードがない場合は少なくとも1つのソーシャルアカウントが必要
    if (!user.password) {
      const socialAccounts = [user.google_id, user.github_id, user.twitter_id, user.line_id].filter(Boolean);
      if (socialAccounts.length <= 1) {
        return res.status(400).json({ 
          error: 'パスワードが設定されていないため、最後のソーシャルアカウントは削除できません' 
        });
      }
    }

    // アカウント連携解除
    const providerField = `${provider}_id`;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        [providerField]: null,
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        google_id: true,
        github_id: true,
        twitter_id: true,
        line_id: true,
        auth_provider: true
      }
    });

    res.json({
      message: `${provider}アカウントの連携を解除しました`,
      user: updatedUser
    });

  } catch (error) {
    console.error('Unlink social account error:', error);
    res.status(500).json({
      error: 'アカウント連携解除に失敗しました'
    });
  }
};

// 他のユーザーのプロフィール取得（パブリック）
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = (req as any).user?.id;

    const user = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      },
      select: {
        id: true,
        username: true,
        display_name: true,
        avatar_url: true,
        created_at: true,
        // bio: true, // 自己紹介文（一時的にコメントアウト）
        _count: {
          select: {
            events: {
              where: {
                is_active: true,
                is_public: true // 公開イベントのみ
              } as any
            },
            comments: true,
            followers: true, // フォロワー数
            following: true  // フォロー数
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 現在のユーザーがこのユーザーをフォローしているかチェック
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const followRelation = await prisma.follow.findUnique({
        where: {
          follower_id_following_id: {
            follower_id: currentUserId,
            following_id: user.id
          }
        }
      });
      isFollowing = !!followRelation;
    }

    res.json({
      user: {
        ...user,
        isFollowing
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      error: 'ユーザープロフィール取得に失敗しました'
    });
  }
};

// 他のユーザーの公開イベント一覧取得
export const getUserPublicEvents = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where: {
          user_id: user.id,
          is_active: true,
          is_public: true // 公開イベントのみ
        } as any,
        include: {
          user: {
            select: {
              id: true,
              display_name: true,
              username: true
            }
          },
          _count: {
            select: {
              comments: true,
              favorites: true
            }
          }
        },
        orderBy: { start_datetime: 'desc' },
        skip,
        take: limit
      }),
      prisma.event.count({
        where: {
          user_id: user.id,
          is_active: true,
          is_public: true // 公開イベントのみ
        } as any
      })
    ]);

    res.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user public events error:', error);
    res.status(500).json({
      error: 'ユーザーイベント取得に失敗しました'
    });
  }
};

// ユーザー検索
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!search || typeof search !== 'string') {
      return res.status(400).json({ error: '検索キーワードを指定してください' });
    }

    const searchTerm = search.trim();
    if (searchTerm.length === 0) {
      return res.status(400).json({ error: '検索キーワードを入力してください' });
    }

    // 検索条件
    const whereConditions = {
      is_active: true,
      OR: [
        {
          username: {
            contains: searchTerm,
            mode: 'insensitive' as const
          }
        },
        {
          display_name: {
            contains: searchTerm,
            mode: 'insensitive' as const
          }
        }
      ]
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereConditions,
        select: {
          id: true,
          username: true,
          display_name: true,
          avatar_url: true,
          // bio: true, // 一時的にコメントアウト
          created_at: true,
          _count: {
            select: {
              events: {
                where: {
                  is_active: true,
                  is_public: true
                } as any
              },
              comments: true
            }
          }
        },
        orderBy: [
          { display_name: 'asc' },
          { username: 'asc' }
        ],
        skip,
        take: Number(limit)
      }),
      prisma.user.count({
        where: whereConditions
      })
    ]);

    res.json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      error: 'ユーザー検索に失敗しました'
    });
  }
};

// ユーザーをフォローする
export const followUser = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // フォロー対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      },
      select: { id: true, username: true, display_name: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // 自分自身をフォローしようとした場合
    if (targetUser.id === currentUserId) {
      return res.status(400).json({ error: '自分自身をフォローすることはできません' });
    }

    // 既にフォローしているかチェック
    const existingFollow = await prisma.follow.findUnique({
      where: {
        follower_id_following_id: {
          follower_id: currentUserId,
          following_id: targetUser.id
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: '既にフォローしています' });
    }

    // フォロー関係を作成
    await prisma.follow.create({
      data: {
        follower_id: currentUserId,
        following_id: targetUser.id
      }
    });

    res.json({
      message: `${targetUser.display_name}さんをフォローしました`,
      isFollowing: true
    });

  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({
      error: 'フォローに失敗しました'
    });
  }
};

// ユーザーのフォローを解除する
export const unfollowUser = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const currentUserId = (req as any).user?.id;

    if (!currentUserId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    // フォロー対象のユーザーを取得
    const targetUser = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      },
      select: { id: true, username: true, display_name: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    // フォロー関係を削除
    const deletedFollow = await prisma.follow.deleteMany({
      where: {
        follower_id: currentUserId,
        following_id: targetUser.id
      }
    });

    if (deletedFollow.count === 0) {
      return res.status(400).json({ error: 'フォローしていません' });
    }

    res.json({
      message: `${targetUser.display_name}さんのフォローを解除しました`,
      isFollowing: false
    });

  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({
      error: 'フォロー解除に失敗しました'
    });
  }
};

// ユーザーのフォロワー一覧取得
export const getUserFollowers = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { following_id: user.id },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              // bio: true, // 一時的にコメントアウト
              _count: {
                select: {
                  followers: true,
                  following: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.follow.count({
        where: { following_id: user.id }
      })
    ]);

    res.json({
      followers: followers.map(f => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user followers error:', error);
    res.status(500).json({
      error: 'フォロワー取得に失敗しました'
    });
  }
};

// ユーザーのフォロー一覧取得
export const getUserFollowing = async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { 
        username,
        is_active: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'ユーザーが見つかりません' });
    }

    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { follower_id: user.id },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true,
              // bio: true, // 一時的にコメントアウト
              _count: {
                select: {
                  followers: true,
                  following: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.follow.count({
        where: { follower_id: user.id }
      })
    ]);

    res.json({
      following: following.map(f => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get user following error:', error);
    res.status(500).json({
      error: 'フォロー中ユーザー取得に失敗しました'
    });
  }
};