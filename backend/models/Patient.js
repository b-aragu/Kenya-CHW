module.exports = (sequelize, DataTypes) => {
    const Patient = sequelize.define('Patient', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      age: { type: DataTypes.INTEGER },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.ENUM('male', 'female', 'other'), allowNull: false },
      location: { type: DataTypes.STRING },
      contact: { type: DataTypes.STRING },
      lastUpdated: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW}
    }, { underscored: true, timestamps: false, indexes: [
      {fields: ['last_updated']},
      {fields: ['user_id']}
    ] });
  
    Patient.associate = models => {
      Patient.belongsTo(models.User, {foreignKey: 'user_id'})
      Patient.hasMany(models.SymptomReport, { foreignKey: 'patientId' });
      Patient.hasMany(models.Consultation, { foreignKey: 'patientId' });
      Patient.hasMany(models.Activity, { foreignKey: 'patientId' });
    };
  
    return Patient;
  };  