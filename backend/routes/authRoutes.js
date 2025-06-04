const express = require('express');
const {register, login} = require('../controllers/authController');

const router = express.Router();

// register a new user
router.post('/register', register);
// user login
router.post('/login', login);

module.exports = router;