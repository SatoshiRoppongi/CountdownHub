import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [eventCount, commentCount, reportedCommentCount, userCount] = await Promise.all([
      prisma.event.count({ where: { is_active: true } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { is_reported: true } }),
      prisma.user.count({ where: { is_active: true } })
    ]);

    res.json({
      events: eventCount,
      comments: commentCount,
      reportedComments: reportedCommentCount,
      users: userCount
    });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { display_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          display_name: true,
          email: true,
          avatar_url: true,
          is_active: true,
          is_admin: true,
          auth_provider: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              events: true,
              comments: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        display_name: true,
        email: true,
        avatar_url: true,
        is_active: true,
        is_admin: true,
        auth_provider: true,
        created_at: true,
        updated_at: true,
        events: {
          select: {
            id: true,
            title: true,
            start_datetime: true,
            is_active: true,
            created_at: true
          },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        comments: {
          select: {
            id: true,
            content: true,
            is_reported: true,
            created_at: true,
            event: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { created_at: 'desc' },
          take: 10
        },
        _count: {
          select: {
            events: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { is_active, is_admin } = req.body;

    const updateData: any = {};
    if (typeof is_active === 'boolean') updateData.is_active = is_active;
    if (typeof is_admin === 'boolean') updateData.is_admin = is_admin;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        display_name: true,
        email: true,
        is_active: true,
        is_admin: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const importEventsFromCSV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const results: any[] = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          const events = results.map(row => ({
            title: row.title,
            description: row.description || null,
            start_datetime: new Date(row.start_datetime),
            end_datetime: row.end_datetime ? new Date(row.end_datetime) : null,
            location: row.location || null,
            venue_type: row.venue_type || null,
            site_url: row.site_url || null,
            image_url: row.image_url || null,
            tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()) : []
          }));

          const createdEvents = await prisma.event.createMany({
            data: events,
            skipDuplicates: true
          });

          fs.unlinkSync(req.file!.path);

          res.json({
            message: `Successfully imported ${createdEvents.count} events`,
            count: createdEvents.count
          });
        } catch (error) {
          fs.unlinkSync(req.file!.path);
          next(error);
        }
      });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};