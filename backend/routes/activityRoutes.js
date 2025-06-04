const express = require('express');
const activityController = require('../controllers/activityController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/recent', verifyToken, activityController.recentActivity);
router.patch('/:id/read', verifyToken, activityController.markAsRead);
router.post('/', verifyToken, activityController.createActivity);

module.exports = router;