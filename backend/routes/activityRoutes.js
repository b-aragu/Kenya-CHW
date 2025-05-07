const express = require('express');
const {recentActivity, markAsRead, createActivity} = require('../controllers/activityController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/recent', verifyToken, recentActivity);
router.patch('/:id/read', verifyToken, markAsRead);
router.post('/', verifyToken, createActivity);

module.exports = router;