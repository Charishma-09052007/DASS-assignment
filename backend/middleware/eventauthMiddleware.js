const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const JWT_SECRET = process.env.JWT_SECRET;

exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Please login'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);

        const User = mongoose.model('User');
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        req.user = user;
        next();

    } catch (err) {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};
