const express = require('express');
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

const router = express.Router();

// Get all user data for dashboard
router.get('/', verifyToken, userController.getUserData);
router.get('/profile', verifyToken, userController.getUserProfile);

module.exports = router;