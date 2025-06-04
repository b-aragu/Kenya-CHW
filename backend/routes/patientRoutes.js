const express = require('express');
const patientController = require('../controllers/patientController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// created new patient
router.post('/', verifyToken, patientController.createPatient);
// get all patients fro a user
router.get('/', verifyToken, patientController.getAllPatients);
// get patient by ID
router.get('/:id', verifyToken, patientController.getPatientById);
// sync offline patients
router.post('/sync', verifyToken, patientController.syncPatients);

module.exports = router;
