module.exports = (sequelize, DataTypes) => {
    const Activity = sequelize.define('Activity', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      message: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.ENUM('urgent', 'new_patient', 'info'), defaultValue: 'info' },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      timestamp: { type: DataTypes.STRING },
      patientId: { type: DataTypes.INTEGER, allowNull: true, field: 'id' },
      userId: { type: DataTypes.INTEGER, allowNull: false, field: 'id' },
    }, { timestamps: true });
  
    Activity.associate = models => {
      Activity.belongsTo(models.Patient, { foreignKey: 'id' });
      Activity.belongsTo(models.User, {foreignKey: 'id'});
    };
  
    return Activity;
  };
  