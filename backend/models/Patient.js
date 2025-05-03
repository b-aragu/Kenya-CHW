const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Patient = sequelize.define('Patient', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    age: { type: DataTypes.INTEGER },
    gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
    location: { type: DataTypes.STRING },
    contact: { type: DataTypes.STRING }
}, { timestamps: true });

module.exports = Patient;
