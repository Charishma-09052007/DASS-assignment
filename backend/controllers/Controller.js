const User = require('../models/User');
const Token = require('../models/Token');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

// Generate Refresh Token
const generateRefreshToken = async (userId) => {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    
    await Token.create({
        userId,
        token: refreshToken,
        type: 'refresh',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });
    
    return refreshToken;
};

// @desc    Register participant
// @route   POST /api/auth/register
// @access  Public
exports.registerParticipant = async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber, collegeName } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }
        
        // Determine participant type
        const isIIIT = email.endsWith('@iiit.ac.in') || email.endsWith('@students.iiit.ac.in');
        
        if (!isIIIT && !collegeName) {
            return res.status(400).json({
                success: false,
                message: 'College name is required for non-IIIT participants'
            });
        }
        
        // Create user
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
        
        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);
        
        // Remove password from output
        user.password = undefined;
        
        res.status(201).json({
            success: true,
            token,
            refreshToken,
            data: {
                user
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Check if email and password exist
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }
        
        // Check if user exists && get password
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check if account is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Please contact admin.'
            });
        }
        
        // Check password
        const isPasswordCorrect = await user.comparePassword(password, user.password);
        
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate tokens
        const token = generateToken(user._id);
        const refreshToken = await generateRefreshToken(user._id);
        
        // Remove password from output
        user.password = undefined;
        
        res.status(200).json({
            success: true,
            token,
            refreshToken,
            data: {
                user
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
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

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Please provide refresh token'
            });
        }
        
        const tokenDoc = await Token.findOne({ 
            token: refreshToken, 
            type: 'refresh',
            expiresAt: { $gt: new Date() }
        });
        
        if (!tokenDoc) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired refresh token'
            });
        }
        
        const user = await User.findById(tokenDoc.userId);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }
        
        const newToken = generateToken(user._id);
        
        res.status(200).json({
            success: true,
            token: newToken
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: req.user
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};