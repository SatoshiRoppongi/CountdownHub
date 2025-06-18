import { Router } from 'express';
import multer from 'multer';
import { getStats, importEventsFromCSV } from '../controllers/adminController';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/stats', getStats);
router.post('/events/import', upload.single('csvFile'), importEventsFromCSV);

export default router;