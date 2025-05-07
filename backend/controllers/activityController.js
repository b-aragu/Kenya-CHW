const {Activity} = require('../models');

// GET api/activites/recent
const recentActivity = async (req, res) =>{
    try{
        const userId = req.user.id;
        const activites = await Activity.findAll({
            where: {id: userId},
            order: [['timestamp', 'DESC']],
            limit: 10,
        });
        res.json(activites);
    } catch (error){
        res.status(500).json({'message': 'erro fetching recent activites', error: error.message});
    }
};

// PATCH /api/activities/:id/read
const markAsRead = async (req, res) =>{
    try{
        const {id} = req.params;
        await Activity.update({read: true}, {where: {id} });
        res.status(204).send();
    } catch (error){
        return res.status(500).json({"message": "Error marking message as read", error: error.message})
    }
};

const createActivity = async(req, res) =>{
    try{
        const { type, message, patientID } = req.body;
        const userId = req.user.id;
        const safePatientID = patientID || null;

        const newActivity = await Activity.create({
            type, message, safePatientID, userId,
        });

        res.status(201).json(newActivity);
    } catch (err) {
        res.status(500).json({message: 'Error creating activity', error: err.message});
    }
};

module.exports = {recentActivity, markAsRead, createActivity};