import { Router } from 'express';
import { getWerks, search, reupload } from '../controllers/ffb.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(checkPermission(PermissionName.WB_FFB_REUPLOAD));

router.get('/werks', getWerks);
router.post('/search', search);
router.post('/reupload', reupload);

export default router;
