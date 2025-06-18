import { Router } from 'express';
import { deleteComment, reportComment } from '../controllers/commentController';

const router = Router();

router.delete('/:id', deleteComment);
router.post('/:id/report', reportComment);

export default router;