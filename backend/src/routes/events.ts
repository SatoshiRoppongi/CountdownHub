import { Router } from 'express';
import { body } from 'express-validator';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventComments,
  createEventComment,
  updateEventComment,
  deleteEventComment
} from '../controllers/eventController';
import { optionalAuth, developmentMode } from '../middleware/auth';

const router = Router();

router.get('/', optionalAuth, getEvents);
router.get('/:id', optionalAuth, getEventById);

router.post('/', [
  developmentMode,
  body('title').notEmpty().withMessage('Title is required'),
  body('start_datetime').isISO8601().withMessage('Valid start datetime is required'),
  body('end_datetime').optional().isISO8601().withMessage('Valid end datetime is required'),
  body('venue_type').optional().custom((value) => {
    if (value === null || value === '' || ['online', 'offline', 'hybrid'].includes(value)) {
      return true;
    }
    throw new Error('Invalid venue type');
  }),
  body('site_url').optional().custom((value) => {
    if (!value || value === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Valid URL is required'),
  body('image_url').optional().custom((value) => {
    if (!value || value === '') return true;
    return /^https?:\/\/.+/.test(value);
  }).withMessage('Valid image URL is required'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
], createEvent);

router.put('/:id', [
  developmentMode,
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('start_datetime').optional().isISO8601().withMessage('Valid start datetime is required'),
  body('venue_type').optional().isIn(['online', 'offline', 'hybrid']).withMessage('Invalid venue type'),
], updateEvent);

router.delete('/:id', [developmentMode], deleteEvent);

router.get('/:id/comments', optionalAuth, getEventComments);
router.post('/:id/comments', [
  developmentMode,
  body('author_name').notEmpty().withMessage('Author name is required'),
  body('content').notEmpty().withMessage('Content is required'),
], createEventComment);

// コメント用のルート（別ファイルに分離予定）
router.put('/:eventId/comments/:commentId', [
  developmentMode,
  body('content').notEmpty().withMessage('Content is required'),
], updateEventComment);
router.delete('/:eventId/comments/:commentId', [developmentMode], deleteEventComment);

export default router;