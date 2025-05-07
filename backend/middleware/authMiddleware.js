const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];
    if (!token) {
        console.log("No token provided");
        return res.status(403).json({message: 'Token required'});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT verify error: ", err.message);
            return res.status(403).json({message: 'Invalid or expired token'});
        }
        req.user = decoded;
        next();
    });
};

module.exports = verifyToken;