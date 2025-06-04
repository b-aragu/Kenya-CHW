const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};

// Dynamical import of all models
fs.readdirSync(__dirname).filter(file => file != 'index.js' && file.endsWith('.js')).forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
});

// associations
Object.keys(db).forEach((modelName) =>{
    if (db[modelName].associate){
        db[modelName].associate(db);
    }
});

// For development only - don't use in production
if (process.env.NODE_ENV === 'development') {
  sequelize.sync({ alter: true })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Sync error:', err));
}

// attach Sequalize instance and class to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;