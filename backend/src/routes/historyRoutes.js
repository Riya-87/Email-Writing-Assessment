import { Router } from 'express';
import { getSessionHistory } from '../controllers/historyController.js';

const router = Router();

router.get('/:sessionId', getSessionHistory);

export default router;
