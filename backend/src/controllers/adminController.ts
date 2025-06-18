import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

export const getStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [eventCount, commentCount, reportedCommentCount] = await Promise.all([
      prisma.event.count({ where: { is_active: true } }),
      prisma.comment.count(),
      prisma.comment.count({ where: { is_reported: true } })
    ]);

    res.json({
      events: eventCount,
      comments: commentCount,
      reportedComments: reportedCommentCount
    });
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