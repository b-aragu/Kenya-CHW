module.exports = (sequelize, DataTypes) => {
    const Patient = sequelize.define('Patient', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      age: { type: DataTypes.INTEGER },
      gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
      location: { type: DataTypes.STRING },
      contact: { type: DataTypes.STRING },
    }, { underscored: true, timestamps: true });
  
    Patient.associate = models => {
      Patient.hasMany(models.SymptomReport, { foreignKey: 'patientId' });
      Patient.hasMany(models.Consultation, { foreignKey: 'patientId' });
      Patient.hasMany(models.Activity, { foreignKey: 'patientId' });
    };
  
    return Patient;
  };  