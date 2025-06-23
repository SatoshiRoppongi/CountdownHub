import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient, ContactCategory } from '@prisma/client';
import { createError } from '../middleware/errorHandler';
import { emailService } from '../services/emailService';

const prisma = new PrismaClient();

export const createContact = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, category, message } = req.body;

    // カテゴリの値を検証
    const validCategories: ContactCategory[] = ['general', 'technical', 'bug', 'feature', 'account', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        message: 'カテゴリが無効です。' 
      });
    }

    console.log('Creating contact with data:', { name, email, subject, category, message });

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        category: category as ContactCategory,
        message,
        status: 'pending'
      }
    });

    console.log('Contact created successfully:', contact.id);

    // メール送信（非同期で実行、エラーでも処理は継続）
    try {
      await emailService.sendContactNotification({
        name,
        email,
        subject,
        category: category as ContactCategory,
        message,
        contactId: contact.id
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // メール送信失敗でもお問い合わせ保存は成功として処理を継続
    }

    res.status(201).json({
      message: 'お問い合わせを受け付けました。返信まで今しばらくお待ちください。',
      contact: {
        id: contact.id,
        created_at: contact.created_at
      }
    });
  } catch (error) {
    console.error('Contact creation error:', error);
    next(error);
  }
};

export const getContacts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      category
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: Number(limit),
        select: {
          id: true,
          name: true,
          email: true,
          subject: true,
          category: true,
          status: true,
          created_at: true,
          updated_at: true
        }
      }),
      prisma.contact.count({ where })
    ]);

    res.json({
      contacts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    next(error);
  }
};

export const getContactById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id: Number(id) }
    });

    if (!contact) {
      throw createError('お問い合わせが見つかりません', 404);
    }

    res.json(contact);
  } catch (error) {
    console.error('Get contact by ID error:', error);
    next(error);
  }
};

export const updateContactStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        message: 'ステータスが無効です。' 
      });
    }

    const contact = await prisma.contact.update({
      where: { id: Number(id) },
      data: { 
        status,
        updated_at: new Date()
      }
    });

    res.json({
      message: 'ステータスを更新しました。',
      contact
    });
  } catch (error) {
    console.error('Update contact status error:', error);
    next(error);
  }
};