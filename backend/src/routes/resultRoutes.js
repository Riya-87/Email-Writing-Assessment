import { Router } from 'express';
import { getAttemptResult } from '../controllers/resultController.js';

const router = Router();

router.get('/:attemptId', getAttemptResult);

export default router;
