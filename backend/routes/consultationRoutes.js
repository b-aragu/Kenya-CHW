const express = require('express');
const consultationController = require('../controllers/consultationController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// create new consultation
router.post('/', verifyToken, consultationController.createConsultation);
// get consultations by user
router.get('/', verifyToken, consultationController.getConsultationsByUser);
// sync offline consultations
router.post('/sync', verifyToken, consultationController.syncConsultaions);

module.exports = router;
