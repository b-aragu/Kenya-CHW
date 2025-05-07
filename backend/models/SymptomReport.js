module.exports = (sequelize, DataTypes) => {
    const SymptomReport = sequelize.define('SymptomReport', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      patientId: { type: DataTypes.INTEGER, allowNull: false },
      symptoms: { type: DataTypes.TEXT, allowNull: false },
      prediction: { type: DataTypes.STRING },
      confidence: { type: DataTypes.FLOAT },
    }, { timestamps: true });
  
    SymptomReport.associate = models => {
      SymptomReport.belongsTo(models.Patient, { foreignKey: 'patientId' });
    };
  
    return SymptomReport;
  };
  