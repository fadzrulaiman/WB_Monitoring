const express = require('express');
const router = express.Router();
const {
    getMWerks,
    getWerks,
    updateCarPlateOut,
    updateCarPlateIn,
    viewCarPlateOut,
    viewCarPlateIn,
    getWerksByTicket,
    getMWerksByTicket
} = require('../controller/cpupdate.controller');

// Define all routes with their corresponding controller functions
router.get('/mwerks', getMWerks);
router.get('/werks', getWerks);
router.post('/update-car-plate-out', updateCarPlateOut);
router.post('/update-car-plate-in', updateCarPlateIn);
router.get('/view-car-plate-out', viewCarPlateOut);
router.get('/view-car-plate-in', viewCarPlateIn);
router.get('/werks-by-ticket', getWerksByTicket);
router.get('/mwerks-by-ticket', getMWerksByTicket);

module.exports = router;