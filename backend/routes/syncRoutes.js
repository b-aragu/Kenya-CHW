const express = require('express');
const router = express.Router()
const syncController = require('../controllers/syncController');
const verifyToken = require('../middleware/authMiddleware');

router.post('/', verifyToken, syncController.handleSync);

module.exports = router;