const express = require('express');
const router = express.Router();
const {
    getMWerks,
    getwbticket,
    updateBargeQuantity,
    viewBargeQuantity
} = require('./barge.controller');

router.get('/mwerks', getMWerks);
router.get('/wb-ticket', getwbticket);
router.post('/update-quantity', updateBargeQuantity);
router.get('/view-quantity', viewBargeQuantity);

module.exports = router;