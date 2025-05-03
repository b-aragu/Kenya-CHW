const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (req, res) => {
    try{
        const { name, email, phone, role, password } = req.body
        const password_hash = await bcrypt.hash(password, 10);

        const user = await User.create({name, email, phone, role, password_hash})
        res.status(201).json({message: 'User registered successfully', user});
    } catch (error) {
        res.status(500).json({message: 'Error registering user', error})
        console.log(error)
    }
};

const login = async (req, res) => {
    try{
        const{phone, password} = req.body;
        const user = await  User.findOne({where: {phone}});

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({message: 'Invalid credentials'});
        }

        const token = jwt.sign({id: user.id, role: user.role}, process.env.JWT_SECRET, {expires: '1h'});

        res.json({message: 'Login successful', token})
    } catch (error){
        res.status(500).json({message: 'Error logging in', error});
        console.log(error)
    }
};

module.exports = {register, login};