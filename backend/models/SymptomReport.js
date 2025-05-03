const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const SymptomReport = sequelize.define('SymptomReport', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    symptoms: { type: DataTypes.TEXT, allowNull: false },
    prediction: { type: DataTypes.STRING },
    confidence: { type: DataTypes.FLOAT }
}, { timestamps: true });

module.exports = SymptomReport;
