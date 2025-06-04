const { type } = require("os");

module.exports = (sequelize, DataTypes) => {
    const Consultation = sequelize.define('Consultation', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      status: { type: DataTypes.ENUM('pending', 'completed', 'cancelled'), defaultValue: 'pending' },
      notes: { type: DataTypes.TEXT},
      details: { type: DataTypes.JSON, allowNull: true, defaultValue: sequelize.literal("JSON_OBJECT()") },
      lastUpdated: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'last_updated'},
    }, { timestamps: false,
      indexes: [
        {fields: ['last_updated']},
        {fields: ['chw_id']},
        {fields: ['doctor_id']},
        {fields: ['patient_id']}
      ]
     });
  
    Consultation.associate = models => {
      Consultation.belongsTo(models.User, { as: 'chw', foreignKey: 'chw_id' });
      Consultation.belongsTo(models.User, { as: 'doctor', foreignKey: 'doctor_id' });
      Consultation.belongsTo(models.Patient, { foreignKey: 'patient_id' });
    };
  
    return Consultation;
  };
  