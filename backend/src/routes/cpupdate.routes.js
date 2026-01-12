import { Router } from 'express';
import {
  getMWerks,
  getWerks,
  updateCarPlateOut,
  updateCarPlateIn,
  viewCarPlateOut,
  viewCarPlateIn,
  getWerksByTicket,
  getMWerksByTicket,
} from '../controllers/cpupdate.controller.js';
import { authenticateToken as authenticate } from '../middleware/auth.middleware.js';
import { checkPermission } from '../middleware/authorization.middleware.js';
import { PermissionName } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(checkPermission(PermissionName.WB_CP_UPDATE));

router.get('/mwerks', getMWerks);
router.get('/werks', getWerks);
router.post('/update-car-plate-out', updateCarPlateOut);
router.post('/update-car-plate-in', updateCarPlateIn);
router.get('/view-car-plate-out', viewCarPlateOut);
router.get('/view-car-plate-in', viewCarPlateIn);
router.get('/werks-by-ticket', getWerksByTicket);
router.get('/mwerks-by-ticket', getMWerksByTicket);

export default router;
