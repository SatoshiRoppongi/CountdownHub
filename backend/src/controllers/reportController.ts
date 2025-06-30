import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 通報機能用のスキーマ（一時的にSimplifiedReportとして実装）
interface SimplifiedReport {
  id: number;
  type: 'user' | 'comment' | 'event';
  target_id: string;
  reporter_id: string;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: Date;
  updated_at: Date;
}

// 一時的なメモリストレージ（実際のプロダクションでは適切なDBテーブルを使用）
const reportsStorage: SimplifiedReport[] = [];
let reportIdCounter = 1;

// 通報を作成
export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = (req as any).user;
    if (!user?.id) {
      return res.status(401).json({ error: '認証が必要です' });
    }

    const { type, target_id, reason, description } = req.body;

    // バリデーション
    if (!['user', 'comment', 'event'].includes(type)) {
      return res.status(400).json({ error: '無効な通報タイプです' });
    }

    if (!target_id || !reason) {
      return res.status(400).json({ error: '必要な情報が不足しています' });
    }

    // 対象の存在確認
    let targetExists = false;
    switch (type) {
      case 'user':
        const targetUser = await prisma.user.findUnique({
          where: { id: target_id, is_active: true }
        });
        targetExists = !!targetUser;
        break;
      case 'comment':
        const targetComment = await prisma.comment.findUnique({
          where: { id: parseInt(target_id) }
        });
        targetExists = !!targetComment;
        break;
      case 'event':
        const targetEvent = await prisma.event.findUnique({
          where: { id: parseInt(target_id), is_active: true }
        });
        targetExists = !!targetEvent;
        break;
    }

    if (!targetExists) {
      return res.status(404).json({ error: '通報対象が見つかりません' });
    }

    // 重複通報の確認
    const existingReport = reportsStorage.find(report => 
      report.type === type && 
      report.target_id === target_id && 
      report.reporter_id === user.id
    );

    if (existingReport) {
      return res.status(400).json({ error: '既に通報済みです' });
    }

    // 通報を作成
    const newReport: SimplifiedReport = {
      id: reportIdCounter++,
      type,
      target_id,
      reporter_id: user.id,
      reason,
      description: description || null,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date()
    };

    reportsStorage.push(newReport);

    // コメントの場合は is_reported フラグを立てる
    if (type === 'comment') {
      await prisma.comment.update({
        where: { id: parseInt(target_id) },
        data: { is_reported: true }
      });
    }

    res.status(201).json({
      message: '通報を受け付けました。確認後、適切に対応いたします。',
      report: {
        id: newReport.id,
        type: newReport.type,
        reason: newReport.reason,
        status: newReport.status,
        created_at: newReport.created_at
      }
    });

  } catch (error) {
    console.error('Create report error:', error);
    next(error);
  }
};

// 管理者向け：通報一覧取得
export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.id || !user?.is_admin) {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }

    const { 
      page = 1, 
      limit = 20, 
      status,
      type 
    } = req.query;

    let filteredReports = [...reportsStorage];

    // フィルタリング
    if (status && status !== 'all') {
      filteredReports = filteredReports.filter(report => report.status === status);
    }

    if (type && type !== 'all') {
      filteredReports = filteredReports.filter(report => report.type === type);
    }

    // ソート（新しい順）
    filteredReports.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    const offset = (Number(page) - 1) * Number(limit);
    const paginatedReports = filteredReports.slice(offset, offset + Number(limit));

    // 詳細情報を追加
    const reportsWithDetails = await Promise.all(
      paginatedReports.map(async (report) => {
        let targetInfo = null;
        try {
          switch (report.type) {
            case 'user':
              const user = await prisma.user.findUnique({
                where: { id: report.target_id },
                select: { id: true, username: true, display_name: true, is_active: true }
              });
              targetInfo = user;
              break;
            case 'comment':
              const comment = await prisma.comment.findUnique({
                where: { id: parseInt(report.target_id) },
                select: { 
                  id: true, 
                  content: true, 
                  author_name: true, 
                  is_reported: true,
                  event: { select: { id: true, title: true } }
                }
              });
              targetInfo = comment;
              break;
            case 'event':
              const event = await prisma.event.findUnique({
                where: { id: parseInt(report.target_id) },
                select: { id: true, title: true, is_active: true }
              });
              targetInfo = event;
              break;
          }
        } catch (error) {
          console.error('Error fetching target info:', error);
        }

        return {
          ...report,
          target_info: targetInfo
        };
      })
    );

    res.json({
      reports: reportsWithDetails,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: filteredReports.length,
        totalPages: Math.ceil(filteredReports.length / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get reports error:', error);
    next(error);
  }
};

// 管理者向け：通報ステータス更新
export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.id || !user?.is_admin) {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: '無効なステータスです' });
    }

    const reportIndex = reportsStorage.findIndex(report => report.id === parseInt(id));
    if (reportIndex === -1) {
      return res.status(404).json({ error: '通報が見つかりません' });
    }

    reportsStorage[reportIndex].status = status;
    reportsStorage[reportIndex].updated_at = new Date();

    res.json({
      message: '通報ステータスを更新しました',
      report: reportsStorage[reportIndex]
    });

  } catch (error) {
    console.error('Update report status error:', error);
    next(error);
  }
};

// 通報統計取得
export const getReportStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user?.id || !user?.is_admin) {
      return res.status(403).json({ error: '管理者権限が必要です' });
    }

    const total = reportsStorage.length;
    const pending = reportsStorage.filter(r => r.status === 'pending').length;
    const reviewed = reportsStorage.filter(r => r.status === 'reviewed').length;
    const resolved = reportsStorage.filter(r => r.status === 'resolved').length;
    const dismissed = reportsStorage.filter(r => r.status === 'dismissed').length;

    const byType = {
      user: reportsStorage.filter(r => r.type === 'user').length,
      comment: reportsStorage.filter(r => r.type === 'comment').length,
      event: reportsStorage.filter(r => r.type === 'event').length
    };

    res.json({
      total,
      by_status: {
        pending,
        reviewed,
        resolved,
        dismissed
      },
      by_type: byType
    });

  } catch (error) {
    console.error('Get report stats error:', error);
    next(error);
  }
};