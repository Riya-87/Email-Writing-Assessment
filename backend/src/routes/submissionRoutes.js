import { Router } from 'express';
import { submitEmail } from '../controllers/submissionController.js';

const router = Router();

router.post('/', submitEmail);

export default router;
