const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Consultation = sequelize.define('Consultation', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    chwId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed'), defaultValue: 'pending' }
}, { timestamps: true });

module.exports = Consultation;
