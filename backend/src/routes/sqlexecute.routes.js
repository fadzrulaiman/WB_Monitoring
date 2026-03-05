import { Router } from 'express';
import { execute, rollbackUpdate, commitUpdate } from '../controllers/sqlexecute.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(checkPermission(PermissionName.WB_SQL_EXECUTE));

router.post('/', execute);
router.post('/rollback', rollbackUpdate);
router.post('/commit', commitUpdate);

export default router;
