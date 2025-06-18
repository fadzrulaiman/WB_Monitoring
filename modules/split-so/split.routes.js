const express = require('express');
const router = express.Router();
const controller = require('./split.controller');

router.post('/search', controller.search);
router.post('/wbtickets-by-mwerks-date', controller.searchwbticket);
router.post('/amend-single-so', controller.amendSplittingToSingleSO);
router.get('/mwerks', controller.getMWerks);
router.get('/wb-tickets', controller.getWbTicketsByMWerksAndDate);

module.exports = router;
