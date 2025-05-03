const Patient = require('../models/Patient');

const createPatient = async (req, res) => {
    try {
        const patient = await Patient.create(req.body);
        res.status(201).json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.findAll();
        res.json(patients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id);
        if (!patient) return res.status(404).json({ message: 'Not found' });
        res.json(patient);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createPatient, getAllPatients, getPatientById };
