const SymptomReport = require('../models/SymptomReport');
const { predictDisease } = require('../utils/predictionEngine');

const createSymptomReport = async (req, res) => {
    try {
        const { patientId, symptoms } = req.body;
        const result = predictDisease(symptoms); // use AI logic here
        const report = await SymptomReport.create({
            patientId,
            symptoms,
            prediction: result.disease,
            confidence: result.confidence
        });
        res.status(201).json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { createSymptomReport };
