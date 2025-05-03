const express = require('express');
const { createPatient, getAllPatients, getPatientById } = require('../controllers/patientController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', verifyToken, createPatient);
router.get('/', verifyToken, getAllPatients);
router.get('/:id', verifyToken, getPatientById);

module.exports = router;
