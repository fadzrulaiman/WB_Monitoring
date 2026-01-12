import { Router } from 'express';
import {
  search,
  searchwbticket,
  amendSplittingToSingleSO,
  getMWerks,
  getWbTicketsByMWerksAndDate,
} from '../controllers/split.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(checkPermission(PermissionName.WB_SPLIT_SO));

router.post('/search', search);
router.post('/wbtickets-by-mwerks-date', searchwbticket);
router.post('/amend-single-so', amendSplittingToSingleSO);
router.get('/mwerks', getMWerks);
router.get('/wb-tickets', getWbTicketsByMWerksAndDate);

export default router;
