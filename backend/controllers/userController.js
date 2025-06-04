const { error } = require('console');
const { Patient, Consultation, Activity } = require('../models');
const { Op } = require('sequelize');
const User = require('../models/User');

const getUserData = async (req, res) => {
    try {
        const userId = req.user.id;

        const [patients, consultations, activites] = await Promise.all([
            Patient.findAll({ where: {user_id: userId}, order: [['last_updated', 'DESC']], }),
            Consultation.findAll({ where: {[Op.or]: [{ chw_id: userId }] }, order: [['last_updated', 'DESC']]} ),
            Activity.findAll({where: {user_id: userId}, order: [['last_updated', 'DESC']], })
        ]);

        res.json({ patients, consultations, activites, lastSync: new Date().toISOString });
    } catch (err) { res.status(500).json({message: 'Failed to get UserData', error: err.message}) }
};

const getUserProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'phone', 'role', 'facility', 'region'], });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {getUserData, getUserProfile};