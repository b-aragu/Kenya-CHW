const { register } = require('module');
const {Patient} = require('../models');

const createPatient = async (req, res) => {
    try {
        const {name, age, gender, location, phone} = req.body;
        const userId = req.user.id;
        if (!name || !age || gender || !location || !phone) return res.status(400).json({message: 'Missing required details'});
        const patient = await Patient.create({name, age, gender, location, phone, chwId: userId, registeredAt: new Date()});
        res.status(201).json({...patient.toJSON(), _syncStatus: 'synced'});
    } catch (error) {
        res.status(500).json({ message: 'Error creating patient', error: error.message });
    }
};

const getAllPatients = async (req, res) => {
    try {
        const userId = req.user.id;
        const patients = await Patient.findAll({ where: { chwId: userId }, order: [['name', 'ASC']] });
        res.json(patients);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patients', error: error.message });
    }
};

const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findByPk(req.params.id, {
            include: [{ association: 'consultations', order: [['createdAt', 'DESC']], limit: 5}]
        });

        if (!patient) return res.status(404).json({ message: 'Not found' });
        res.json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient', error: error.message });
    }
};

const syncPatients = async (req, res) => {
    try {
        const { pendingPatients } = req.body;
        const userId = req.user.id;

        const results = [];

        for (const patient of pendingPatients) {
            if (patient._syncStatus === 'pending'){
                const created = await Patient.create({...patient, chwId: userId, _syncStatus: undefined});
                results.push(created);
            }
        }

        res.json({success: true, results});
    } catch (err) { res.status(500).json({message: 'Sync Failed', error: err.message }); }
};

module.exports = { createPatient, getAllPatients, getPatientById, syncPatients};
