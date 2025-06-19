import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { createError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      tags,
      venue_type,
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

    const orderBy: any = {};
    orderBy[sort_by as string] = order;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy,
        skip: offset,
        take: Number(limit),
        include: {
          _count: {
            select: { comments: true }
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
  try {
    const { id } = req.params;
    
    const event = await prisma.event.findUnique({
      where: { id: Number(id) },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    });

    if (!event) {
      throw createError('Event not found', 404);
    }

    res.json(event);
  } catch (error) {
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

    // データクリーニング
    const eventData = {
      ...req.body,
      venue_type: req.body.venue_type === '' ? null : req.body.venue_type,
      site_url: req.body.site_url === '' ? null : req.body.site_url,
      image_url: req.body.image_url === '' ? null : req.body.image_url,
      location: req.body.location === '' ? null : req.body.location,
      description: req.body.description === '' ? null : req.body.description,
    };

    console.log('Creating event with data:', eventData);

    const event = await prisma.event.create({
      data: eventData
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
    
    const event = await prisma.event.update({
      where: { id: Number(id) },
      data: {
        ...req.body,
        updated_at: new Date()
      }
    });

    res.json(event);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.event.update({
      where: { id: Number(id) },
      data: { is_active: false }
    });

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
    
    const comment = await prisma.comment.create({
      data: {
        ...req.body,
        event_id: Number(id)
      }
    });

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
    
    // コメントが存在し、指定されたイベントに属するかチェック
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: Number(commentId),
        event_id: Number(eventId),
        is_reported: false
      }
    });

    if (!existingComment) {
      throw createError('Comment not found', 404);
    }

    const comment = await prisma.comment.update({
      where: { id: Number(commentId) },
      data: {
        content: req.body.content
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
    
    // コメントが存在し、指定されたイベントに属するかチェック
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: Number(commentId),
        event_id: Number(eventId)
      }
    });

    if (!existingComment) {
      throw createError('Comment not found', 404);
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