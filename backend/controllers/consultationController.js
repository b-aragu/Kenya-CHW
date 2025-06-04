const { Result } = require('postcss');
const {Consultation} = require('../models');

const createConsultation = async (req, res) => {
    try {
        const {patientId, symptoms, notes} = req.body;
        const userId = req.user.id;

        if (!patientId || !symptoms) return res.status(400).json({message: 'Patient ID and Symptoms are required'});

        const consultation = await Consultation.create({chwId: userId, patientId, symptoms, notes, status: 'pending', createdAt: new Date()});

        res.status(201).json({...consultation.toJSON(), _patient: req.body._patient || null});
    } catch (error) {
        res.status(500).json({ message: 'Error creting consultation', error: error.message });
    }
};

const getConsultationsByUser = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const filterKey = role === 'doctor' ? 'doctorId' : 'chwId';
        const consultations = await Consultation.findAll({ where: { [filterKey]: userId }, order: [['createdAt', 'DESC']] });
        res.json(consultations);
    } catch (error) {
        res.status(500).json({message: 'Error fetching consultations', error: error.message });
    }
};

const syncConsultaions = async (req, res) => {
    try {
        const { pendingConsultations } = req.body;
        const userId = req.user.id;

        const results = [];

        for (const consultation of pendingConsultations) {
            if (consultation._syncStatus === 'pending') {
                const created = await Consultation.create({...consultation, chwId: userId, _syncStatus: undefined});
                results.push(created);
            }
        }

        res.json({success: true, results});
    } catch (err){
        res.status(500).json({message: 'Sync failed', error: err.message});
    }
};

module.exports = { createConsultation, getConsultationsByUser, syncConsultaions };
