const express = require('express');
const { createSymptomReport } = require('../controllers/predictionController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createSymptomReport);

module.exports = router;
