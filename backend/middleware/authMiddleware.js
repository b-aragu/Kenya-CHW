const jwt = require('jsonwebtoken');

const verifyToken = (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).json({message: 'Token required'});

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({message: 'Invalid or expired token'});
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;