import { Router } from 'express';
import { execute } from '../controllers/sqlexecute.controller.js';

const router = Router();

router.post('/', execute);

export default router;
