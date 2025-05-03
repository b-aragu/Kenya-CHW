const Consultation = require('../models/Consultation');

const createConsultation = async (req, res) => {
    try {
        const consultation = await Consultation.create(req.body);
        res.status(201).json(consultation);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getConsultationsByUser = async (req, res) => {
    try {
        const { userId, role } = req.user;
        const filterKey = role === 'doctor' ? 'doctorId' : 'chwId';
        const consultations = await Consultation.findAll({ where: { [filterKey]: userId } });
        res.json(consultations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createConsultation, getConsultationsByUser };
