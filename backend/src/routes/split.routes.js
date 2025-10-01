import { Router } from 'express';
import {
  search,
  searchwbticket,
  amendSplittingToSingleSO,
  getMWerks,
  getWbTicketsByMWerksAndDate,
} from '../controllers/split.controller.js';

const router = Router();

router.post('/search', search);
router.post('/wbtickets-by-mwerks-date', searchwbticket);
router.post('/amend-single-so', amendSplittingToSingleSO);
router.get('/mwerks', getMWerks);
router.get('/wb-tickets', getWbTicketsByMWerksAndDate);

export default router;
