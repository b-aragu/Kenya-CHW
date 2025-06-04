const { type } = require("os");

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false, validate: {notEmpty: true} },
      email: { type: DataTypes.STRING, allowNull: false, unique: true , validate: {isEmail: true}},
      phone: { type: DataTypes.STRING, allowNull: false, validate: {notEmpty: true} },
      role: { type: DataTypes.ENUM('chw', 'doctor', 'admin'), allowNull: false, defaultValue: 'chw' },
      facility: { type: DataTypes.STRING, allowNull: true },
      region: { type: DataTypes.STRING, allowNull: true },
      
      password_hash: { type: DataTypes.STRING, allowNull: false },
      lastUpdate: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'last_updated'}
    }, { timestamps: false, underscored: true, indexes: [
      {fields: ['email']},
      {fields: ['role']},
      {fields: ['last_updated']}
    ] });
  
    User.associate = models => {
      User.hasMany(models.Consultation, { foreignKey: 'chw_id', as: 'chwConsultations' });
      User.hasMany(models.Consultation, { foreignKey: 'doctor_id', as: 'doctorConsultations' });
      User.hasMany(models.Patient, {foreignKey: 'user_id'});
      User.hasMany(models.Activity, {foreignKey: 'user_id'});
    };
  
    return User;
  };
  