module.exports = (sequelize, DataTypes) => {
    const Activity = sequelize.define('Activity', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      message: { type: DataTypes.STRING, allowNull: false },
      type: { type: DataTypes.ENUM('urgent', 'new_patient', 'info', 'consultation'), defaultValue: 'info' },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      lastUpdated: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'last_updated'}
    }, { timestamps: false, indexes: [
      {fields: ['last_updated']},
      {fields: ['user_id']},
      {fields: ['patient_id']}
    ] });
  
    Activity.associate = models => {
      Activity.belongsTo(models.Patient, { foreignKey: 'patient_id' });
      Activity.belongsTo(models.User, {foreignKey: 'user_id'});
    };
  
    return Activity;
  };
  