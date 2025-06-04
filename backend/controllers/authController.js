const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {User} = require('../models');

const register = async (req, res) => {
    try{
        const { name, email, phone, role, password, facility, region } = req.body

        // validate required fields
        if (!name || !phone || !password) return res.status(400).json({message: 'Missing required fields'});

        const password_hash = await bcrypt.hash(password, 10);
        const user = await User.create({name, email: email || null, phone, role: role || 'chw', facility: facility || null, region: region || null, password_hash});

        // remove paswward hash from response
        const userResponse = user.toJSON();
        delete userResponse.password_hash;
        res.status(201).json({message: 'User registered successfully', user: userResponse});
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraint') {
            return res.status.json({message: 'Phone number already registered'});
        }
        res.status(500).json({message: 'Error registering user', error});
        console.error(error);
    }
};

const login = async (req, res) => {
    try{
        const{phone, pin} = req.body;
        const user = await  User.findOne({where: { phone } });

        if (!user) {
            return res.status(401).json({message: 'User not found'});
        }

        const isMatch = await bcrypt.compare(pin, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({message: 'Invalid password/pin'})
        }

        const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '8h'});

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                facility: user.facility,
                region: user.region,
                offlineCappable: true
            }
        })
    } catch (error){
        console.error('Login Error: ', error);
        res.status(500).json({message: 'Error logging in', error: error.message});
    }
};

module.exports = {register, login};