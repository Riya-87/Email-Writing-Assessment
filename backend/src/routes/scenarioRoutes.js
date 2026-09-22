import { Router } from 'express';
import { getRandomScenario } from '../controllers/scenarioController.js';

const router = Router();

router.get('/random', getRandomScenario);

export default router;
