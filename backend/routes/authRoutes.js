const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// ================= REGISTER =================
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber, collegeName } = req.body;

        if (!firstName || !lastName || !email || !password || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }

        const isIIIT = email.endsWith('@iiit.ac.in');

        if (!isIIIT && (!collegeName || collegeName.trim() === '')) {
            return res.status(400).json({
                success: false,
                message: 'College name is required for non-IIIT participants'
            });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password, // model hashes automatically
            role: 'participant',
            participantType: isIIIT ? 'iiit' : 'non-iiit',
            contactNumber,
            collegeName: isIIIT ? 'IIIT Hyderabad' : collegeName,
            interests: [],
            followedClubs: [],
            onboardingCompleted: false
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        user.password = undefined;

        res.status(201).json({
            success: true,
            token,
            data: { user }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================= LOGIN =================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isPasswordValid = await user.comparePassword(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        user.password = undefined;

        res.json({
            success: true,
            token,
            data: { user }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ================= GET CURRENT USER (PROTECTED) =================
router.get('/me', protect, (req, res) => {
    res.json({
        success: true,
        data: { user: req.user }
    });
});

module.exports = router;
