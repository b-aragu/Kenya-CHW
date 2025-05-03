const express = require('express');
const { createConsultation, getConsultationsByUser } = require('../controllers/consultationController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createConsultation);
router.get('/', verifyToken, getConsultationsByUser);

module.exports = router;
