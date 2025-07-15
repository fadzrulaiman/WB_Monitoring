const express = require('express');
const router = express.Router();
const sqlexecuteController = require('../controller/sqlexecute.controller');

// Only allow POST /api/sqlexecute for SELECT queries
router.post('/', sqlexecuteController.execute);

module.exports = router;
