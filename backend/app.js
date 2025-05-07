const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const sequelize = require('./config/db');

// route files
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/patientRoutes');
const consultationRoutes = require('./routes/consultationRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const activityController = require('./routes/activityRoutes');

dotenv.config();

const app = express();

// midleware
app.use(express.json());
app.use(cors({
    origin: "http://localhost:8080",
    credentials: true
}));

// ROutes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/activities', activityController);

// database

sequelize.sync().then(() => {
    console.log('Database synced');
}).catch((err) => {
    console.error('Error syncing database', err);
});

module.exports = app;