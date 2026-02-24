const User = require('../models/User');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateRefreshToken = async (userId) => {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    await Token.create({
        userId,
        token: refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    
    return refreshToken;
};

exports.registerParticipant = async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber, collegeName } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        const isIIIT = email.endsWith('@iiit.ac.in');
        
        if (!isIIIT && !collegeName) {
            return res.status(400).json({
                success: false,
                message: 'College name is required for non-IIIT participants'
            });
        }
        
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            contactNumber,
            collegeName: isIIIT ? 'IIIT Hyderabad' : collegeName,
            role: 'participant',
            participantType: isIIIT ? 'iiit' : 'non-iiit'
        });
        
        const token = generateToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);
        
        user.password = undefined;
        
        res.status(201).json({
            success: true,
            token,
            refreshToken,
            data: { user }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account deactivated'
            });
        }
        
        const isPasswordCorrect = await user.comparePassword(password, user.password);
        
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        const token = generateToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);
        
        user.password = undefined;
        
        res.status(200).json({
            success: true,
            token,
            refreshToken,
            data: { user }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await Token.findOneAndDelete({ token: refreshToken, type: 'refresh' });
        }
        
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: { user: req.user }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};