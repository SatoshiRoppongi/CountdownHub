import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient, AnnouncementType, AnnouncementPriority } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

// 管理者用：お知らせ一覧取得
export const getAnnouncementsAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      is_active
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};

    if (type) {
      where.type = type;
    }

    if (priority) {
      where.priority = priority;
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { created_at: 'desc' }
        ],
        skip: offset,
        take: Number(limit),
        include: {
          creator: {
            select: {
              id: true,
              display_name: true,
              username: true
            }
          }
        }
      }),
      prisma.announcement.count({ where })
    ]);

    res.json({
      announcements,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get announcements admin error:', error);
    next(error);
  }
};

// ユーザー用：アクティブなお知らせ一覧取得
export const getActiveAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();

    const announcements = await prisma.announcement.findMany({
      where: {
        is_active: true,
        OR: [
          {
            start_date: null,
            end_date: null
          },
          {
            start_date: null,
            end_date: { gte: now }
          },
          {
            start_date: { lte: now },
            end_date: null
          },
          {
            start_date: { lte: now },
            end_date: { gte: now }
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { created_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        priority: true,
        created_at: true,
        updated_at: true
      }
    });

    res.json({ announcements });
  } catch (error) {
    console.error('Get active announcements error:', error);
    next(error);
  }
};

// お知らせ作成
export const createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const user = (req as any).user;
    if (!user) {
      throw createError('認証が必要です', 401);
    }

    const { title, content, type, priority, is_active, start_date, end_date } = req.body;

    console.log('Creating announcement with data:', { title, content, type, priority, is_active, start_date, end_date });

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        type: type as AnnouncementType,
        priority: priority as AnnouncementPriority,
        is_active: is_active ?? true,
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        created_by: user.id
      },
      include: {
        creator: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    console.log('Announcement created successfully:', announcement.id);

    res.status(201).json({
      message: 'お知らせを作成しました。',
      announcement
    });
  } catch (error) {
    console.error('Announcement creation error:', error);
    next(error);
  }
};

// お知らせ取得
export const getAnnouncementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const announcement = await prisma.announcement.findUnique({
      where: { id: Number(id) },
      include: {
        creator: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    if (!announcement) {
      throw createError('お知らせが見つかりません', 404);
    }

    res.json(announcement);
  } catch (error) {
    console.error('Get announcement by ID error:', error);
    next(error);
  }
};

// お知らせ更新
export const updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = (req as any).user;

    if (!user) {
      throw createError('認証が必要です', 401);
    }

    const { title, content, type, priority, is_active, start_date, end_date } = req.body;

    const updateData: any = {
      title,
      content,
      type: type as AnnouncementType,
      priority: priority as AnnouncementPriority,
      is_active,
      updated_at: new Date()
    };

    if (start_date !== undefined) {
      updateData.start_date = start_date ? new Date(start_date) : null;
    }

    if (end_date !== undefined) {
      updateData.end_date = end_date ? new Date(end_date) : null;
    }

    const announcement = await prisma.announcement.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            display_name: true,
            username: true
          }
        }
      }
    });

    res.json({
      message: 'お知らせを更新しました。',
      announcement
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    next(error);
  }
};

// お知らせ削除
export const deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    if (!user) {
      throw createError('認証が必要です', 401);
    }

    await prisma.announcement.delete({
      where: { id: Number(id) }
    });

    res.json({
      message: 'お知らせを削除しました。'
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    next(error);
  }
};