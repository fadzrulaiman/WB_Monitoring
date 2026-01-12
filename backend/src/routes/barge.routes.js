import { Router } from 'express';
import { getMWerks, getwbticket, updateBargeQuantity, viewBargeQuantity } from '../controllers/barge.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(checkPermission(PermissionName.WB_BARGE_UPDATE));

router.get('/mwerks', getMWerks);
router.get('/wb-ticket', getwbticket);
router.post('/update-quantity', updateBargeQuantity);
router.get('/view-quantity', viewBargeQuantity);

export default router;
