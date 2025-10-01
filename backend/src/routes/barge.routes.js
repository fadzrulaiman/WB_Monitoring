import { Router } from 'express';
import { getMWerks, getwbticket, updateBargeQuantity, viewBargeQuantity } from '../controllers/barge.controller.js';

const router = Router();

router.get('/mwerks', getMWerks);
router.get('/wb-ticket', getwbticket);
router.post('/update-quantity', updateBargeQuantity);
router.get('/view-quantity', viewBargeQuantity);

export default router;
