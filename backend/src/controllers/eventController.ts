import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { NotificationService } from '../services/notificationService';

const prisma = new PrismaClient();

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      venue_type,
      timeCategory,
      sort_by = 'start_datetime',
      order = 'asc'
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {
      is_active: true
    };

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { hasSome: tagArray };
    }

    if (venue_type) {
      where.venue_type = venue_type;
    }

    // timeCategory filtering
    if (timeCategory) {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

      switch (timeCategory) {
        case 'today':
          // 当日未開催 (今日の00:00 <= 開始時刻 < 明日の00:00 and 開始時刻 > 現在時刻)
          where.start_datetime = {
            gte: startOfToday,
            lt: startOfTomorrow
          };
          where.OR = [
            { end_datetime: null, start_datetime: { gt: now } },
            { end_datetime: { not: null }, start_datetime: { gt: now } }
          ];
          break;
        case 'upcoming':
          // 明日以降 (開始時刻 >= 明日の00:00)
          where.start_datetime = {
            gte: startOfTomorrow
          };
          break;
        case 'ongoing':
          // 開催中 (開始時刻 <= 現在時刻 < 終了時刻)
          where.start_datetime = { lte: now };
          where.OR = [
            { end_datetime: null },
            { end_datetime: { gt: now } }
          ];
          break;
        case 'ended':
          // 終了済み (終了時刻 < 現在時刻)
          where.OR = [
            { end_datetime: { lt: now } },
            { end_datetime: null, start_datetime: { lt: now } }
          ];
          break;
      }
    }

    let orderBy: any = {};
    if (sort_by === 'favorites') {
      orderBy = {
        favorites: {
          _count: order
        }
      };
    } else if (sort_by === 'comments') {
      orderBy = {
        comments: {
          _count: order
        }
      };
    } else {
      orderBy[sort_by as string] = order;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: offset,
        take: Number(limit),
        include: {
          _count: {
            select: { 
              comments: true, 
              favorites: true 
            }
          },
          user: {
            select: {
              id: true,
              display_name: true,
              username: true
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    res.json({
      events,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  try {
    console.log(`Getting event by ID: ${id}`);
    
    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { 
            comments: true, 
            favorites: true 
          }
        },
        user: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    if (!event) {
      console.log(`Event not found: ${id}`);
      throw createError('Event not found', 404);
    }

    console.log(`Event found: ${event.title}`);
    res.json(event);
  } catch (error) {
    console.error(`Error getting event ${id}:`, error);
    next(error);
  }
};

export const createEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = (req as any).user;

    // データクリーニング
    const eventData = {
      ...req.body,
      venue_type: req.body.venue_type === '' ? null : req.body.venue_type,
      site_url: req.body.site_url === '' ? null : req.body.site_url,
      image_url: req.body.image_url === '' ? null : req.body.image_url,
      location: req.body.location === '' ? null : req.body.location,
      description: req.body.description === '' ? null : req.body.description,
      user_id: user?.id || null, // ユーザーIDを追加
    };

    console.log('Creating event with data:', eventData);

    const event = await prisma.event.create({
      data: eventData,
      include: {
        _count: {
          select: { 
            comments: true, 
            favorites: true 
          }
        },
        user: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    res.status(201).json(event);
  } catch (error) {
    console.error('Database error:', error);
    next(error);
  }
};

export const updateEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = (req as any).user;
    
    // イベントの所有者確認
    const existingEvent = await prisma.event.findUnique({
      where: { id: Number(id) },
      select: { user_id: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    // 開発モード以外では所有者のみ編集可能
    if (user?.id !== 'dev-user' && existingEvent.user_id && existingEvent.user_id !== user?.id) {
      return res.status(403).json({ error: '他のユーザーが作成したイベントは編集できません' });
    }
    
    const event = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        updated_at: new Date()
      },
      include: {
        _count: {
          select: { 
            comments: true, 
            favorites: true 
          }
        },
        user: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    // Create notification for event update
    const updatedFields = Object.keys(req.body).filter(key => key !== 'updated_at');
    if (updatedFields.length > 0) {
      await NotificationService.createEventUpdatedNotification(Number(id), updatedFields);
    }

    res.json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    
    // イベントの所有者確認
    const existingEvent = await prisma.event.findUnique({
      where: { id: Number(id) },
      select: { user_id: true }
    });

    if (!existingEvent) {
      return res.status(404).json({ error: 'イベントが見つかりません' });
    }

    // 開発モード以外では所有者のみ削除可能
    if (user?.id !== 'dev-user' && existingEvent.user_id && existingEvent.user_id !== user?.id) {
      return res.status(403).json({ error: '他のユーザーが作成したイベントは削除できません' });
    }
    
    await prisma.event.update({
      where: { id: Number(id) },
      data: { is_active: false }
    });

    // Create notification for event cancellation
    await NotificationService.createEventCancelledNotification(Number(id));

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getEventComments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, sort = 'desc' } = req.query;
    
    const offset = (Number(page) - 1) * Number(limit);
    const sortOrder = sort === 'asc' ? 'asc' : 'desc';
    
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { 
          event_id: Number(id),
          is_reported: false
        },
        orderBy: { created_at: sortOrder },
        skip: offset,
        take: Number(limit)
      }),
      prisma.comment.count({
        where: { 
          event_id: Number(id),
          is_reported: false
        }
      })
    ]);

    const hasMore = offset + comments.length < total;

    res.json({
      comments,
      total,
      hasMore,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (error) {
    next(error);
  }
};

export const createEventComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = (req as any).user;
    
    const comment = await prisma.comment.create({
      data: {
        ...req.body,
        event_id: Number(id),
        user_id: user?.id || null, // ユーザーIDを追加
      }
    });

    // Create notification for interested users
    if (user?.id && req.body.author_name) {
      await NotificationService.createCommentNotification(
        Number(id),
        user.id,
        req.body.author_name
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
};

export const updateEventComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { eventId, commentId } = req.params;
    const user = (req as any).user;
    
    // コメントが存在し、指定されたイベントに属するかチェック
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: Number(commentId),
        event_id: Number(eventId),
        is_reported: false
      }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'コメントが見つかりません' });
    }

    // 開発モード以外では所有者のみ編集可能
    if (user?.id !== 'dev-user' && existingComment.user_id && existingComment.user_id !== user?.id) {
      return res.status(403).json({ error: '他のユーザーが作成したコメントは編集できません' });
    }

    const comment = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: {
        content: req.body.content,
        updated_at: new Date()
      }
    });

    res.json(comment);
  } catch (error) {
    next(error);
  }
};

export const deleteEventComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId, commentId } = req.params;
    const user = (req as any).user;
    
    // コメントが存在し、指定されたイベントに属するかチェック
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: Number(commentId),
        event_id: Number(eventId)
      }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'コメントが見つかりません' });
    }

    // 開発モード以外では所有者のみ削除可能
    if (user?.id !== 'dev-user' && existingComment.user_id && existingComment.user_id !== user?.id) {
      return res.status(403).json({ error: '他のユーザーが作成したコメントは削除できません' });
    }

    // 物理削除ではなく、is_reported フラグを立てる（ソフト削除）
    await prisma.comment.update({
      where: { id: Number(commentId) },
      data: { is_reported: true }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};