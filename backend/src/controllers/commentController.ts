import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const deleteComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.comment.delete({
      where: { id: Number(id) }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const reportComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    await prisma.comment.update({
      where: { id: Number(id) },
      data: { is_reported: true }
    });

    res.json({ message: 'Comment reported successfully' });
  } catch (error) {
    next(error);
  }
};