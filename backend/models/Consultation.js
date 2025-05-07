module.exports = (sequelize, DataTypes) => {
    const Consultation = sequelize.define('Consultation', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chwId: { type: DataTypes.INTEGER, allowNull: false },
      doctorId: { type: DataTypes.INTEGER, allowNull: false },
      patientId: { type: DataTypes.INTEGER, allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'completed'), defaultValue: 'pending' }
    }, { timestamps: true });
  
    Consultation.associate = models => {
      Consultation.belongsTo(models.User, { as: 'chw', foreignKey: 'chwId' });
      Consultation.belongsTo(models.User, { as: 'doctor', foreignKey: 'doctorId' });
      Consultation.belongsTo(models.Patient, { foreignKey: 'patientId' });
    };
  
    return Consultation;
  };
  