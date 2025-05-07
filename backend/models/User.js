module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      name: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      phone: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('chw', 'doctor', 'admin'), allowNull: false },
      password_hash: { type: DataTypes.STRING, allowNull: false },
    }, { timestamps: true });
  
    User.associate = models => {
      User.hasMany(models.Consultation, { foreignKey: 'chwId', as: 'chwConsultations' });
      User.hasMany(models.Consultation, { foreignKey: 'doctorId', as: 'doctorConsultations' });
    };
  
    return User;
  };
  