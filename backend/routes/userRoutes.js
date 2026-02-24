const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getProfile,
    updateProfile,
    updateInterests,
    toggleFollowClub,
    getAllClubs,
    getOnboardingStatus,
    skipOnboarding
} = require('../controllers/userController');

// All routes below are protected
router.use(protect);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Interests routes
router.put('/interests', updateInterests);
router.get('/onboarding-status', getOnboardingStatus);
router.post('/skip-onboarding', skipOnboarding);

// Clubs routes
router.get('/clubs', getAllClubs);
router.post('/follow/:clubId', toggleFollowClub);

module.exports = router;