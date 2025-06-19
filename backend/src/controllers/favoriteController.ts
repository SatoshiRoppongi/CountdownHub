import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// お気に入り追加
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) {
      return res.status(400).json({ error: '無効なイベントIDです' });
    }

    // イベントが存在するかチェック
    const event = await prisma.event.findUnique({
      where: { id: eventIdNum }
    });

    if (!event) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    // 既にお気に入りに追加されているかチェック
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventIdNum,
          user_id: user.id
        }
      }
    });

    if (existingFavorite) {
      return res.status(409).json({ error: '既にお気に入りに追加されています' });
    }

    // お気に入りを追加
    const favorite = await prisma.favorite.create({
      data: {
        event_id: eventIdNum,
        user_id: user.id
      }
    });

    res.status(201).json({
      message: 'お気に入りに追加しました',
      favorite
    });
  } catch (error) {
    console.error('お気に入り追加エラー:', error);
    res.status(500).json({ error: 'お気に入りの追加に失敗しました' });
  }
};

// お気に入り削除
export const removeFavorite = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) {
      return res.status(400).json({ error: '無効なイベントIDです' });
    }

    // お気に入りが存在するかチェック
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        event_id_user_id: {
          event_id: eventIdNum,
          user_id: user.id
        }
      }
    });

    if (!existingFavorite) {
      return res.status(404).json({ error: 'お気に入りが見つかりません' });
    }

    // お気に入りを削除
    await prisma.favorite.delete({
      where: {
        event_id_user_id: {
          event_id: eventIdNum,
          user_id: user.id
        }
      }
    });

    res.json({ message: 'お気に入りから削除しました' });
  } catch (error) {
    console.error('お気に入り削除エラー:', error);
    res.status(500).json({ error: 'お気に入りの削除に失敗しました' });
  }
};

// ユーザーのお気に入り一覧取得
export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where: { user_id: user.id },
        include: {
          event: {
            include: {
              _count: {
                select: {
                  comments: true,
                  favorites: true
                }
              }
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.favorite.count({
        where: { user_id: user.id }
      })
    ]);

    const events = favorites.map(favorite => ({
      ...favorite.event,
      is_favorited: true
    }));

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
    console.error('お気に入り一覧取得エラー:', error);
    res.status(500).json({ error: 'お気に入り一覧の取得に失敗しました' });
  }
};

// イベントのお気に入り状態チェック
export const checkFavoriteStatus = async (req: Request, res: Response) => {
  try {
    const { eventId } = req.params;
    const user = (req as any).user;

    const eventIdNum = parseInt(eventId, 10);
    if (isNaN(eventIdNum)) {
      return res.status(400).json({ error: '無効なイベントIDです' });
    }

    let is_favorited = false;

    if (user) {
      const favorite = await prisma.favorite.findUnique({
        where: {
          event_id_user_id: {
            event_id: eventIdNum,
            user_id: user.id
          }
        }
      });
      is_favorited = !!favorite;
    }

    res.json({ is_favorited });
  } catch (error) {
    console.error('お気に入り状態チェックエラー:', error);
    res.status(500).json({ error: 'お気に入り状態の確認に失敗しました' });
  }
};