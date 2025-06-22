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
    .max(100, '表示名は100文字以下で入力してください')
    .optional()
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

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({
        error: existingUser.email === email 
          ? 'このメールアドレスは既に使用されています' 
          : 'このユーザー名は既に使用されています'
      });
    }

    // パスワードハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        display_name: display_name || username
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        created_at: true
      }
    });

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

// プロフィール更新
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const { display_name } = req.body;

    if (!display_name || display_name.trim() === '') {
      return res.status(400).json({ error: 'ニックネームを入力してください' });
    }

    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        display_name: display_name.trim(),
        updated_at: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        created_at: true
      }
    });

    // ユーザーのすべてのコメントの表示名も更新
    await prisma.comment.updateMany({
      where: { user_id: userId },
      data: {
        author_name: display_name.trim(),
        updated_at: new Date()
      }
    });

    res.json({
      message: 'プロフィールを更新しました',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update profile error:', error);
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
        created_by: userId 
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
      return res.redirect(`${getFrontendUrl()}/auth?error=oauth_error`);
    }

    if (!user) {
      return res.redirect(`${getFrontendUrl()}/auth?error=oauth_failed`);
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
      res.redirect(`${getFrontendUrl()}/auth?error=token_error`);
    }
  })(req, res, next);
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