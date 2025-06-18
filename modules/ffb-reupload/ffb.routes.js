const express = require('express');
const router = express.Router();
const ffbReuploadController = require('./ffb.controller');

router.get('/werks', ffbReuploadController.getWerks);
router.post('/search', ffbReuploadController.search);
router.post('/reupload', ffbReuploadController.reupload);

module.exports = router;