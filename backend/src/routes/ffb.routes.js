import { Router } from 'express';
import { getWerks, search, reupload } from '../controllers/ffb.controller.js';

const router = Router();

router.get('/werks', getWerks);
router.post('/search', search);
router.post('/reupload', reupload);

export default router;
