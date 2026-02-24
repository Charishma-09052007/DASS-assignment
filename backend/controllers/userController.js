const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('followedClubs', 'firstName lastName email');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests } = req.body;
        
        const updateData = {
            firstName,
            lastName,
            contactNumber,
            collegeName,
            interests: interests || [],
            onboardingCompleted: true
        };
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update interests only
// @route   PUT /api/users/interests
// @access  Private
exports.updateInterests = async (req, res) => {
    try {
        const { interests } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { interests, onboardingCompleted: true },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Follow/Unfollow club
// @route   POST /api/users/follow/:clubId
// @access  Private
exports.toggleFollowClub = async (req, res) => {
    try {
        const { clubId } = req.params;
        
        const club = await User.findOne({ _id: clubId, role: 'organizer' });
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }
        
        const user = await User.findById(req.user._id);
        
        const isFollowing = user.followedClubs.includes(clubId);
        
        if (isFollowing) {
            user.followedClubs = user.followedClubs.filter(id => id.toString() !== clubId);
        } else {
            user.followedClubs.push(clubId);
        }
        
        await user.save();
        
        res.json({
            success: true,
            message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
            data: { followedClubs: user.followedClubs }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get all clubs/organizers
// @route   GET /api/users/clubs
// @access  Private
exports.getAllClubs = async (req, res) => {
    try {
        const clubs = await User.find({ 
            role: 'organizer',
            isActive: true 
        }).select('firstName lastName email');
        
        res.json({ success: true, count: clubs.length, data: clubs });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Get onboarding status
// @route   GET /api/users/onboarding-status
// @access  Private
exports.getOnboardingStatus = async (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                onboardingCompleted: req.user.onboardingCompleted,
                interests: req.user.interests,
                followedClubs: req.user.followedClubs
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Skip onboarding
// @route   POST /api/users/skip-onboarding
// @access  Private
exports.skipOnboarding = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { onboardingCompleted: true },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, message: 'Onboarding skipped', data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};