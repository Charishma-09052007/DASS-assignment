const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
    createOrganizer,
    getAllOrganizers,
    removeOrganizer
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);
router.use(restrictTo('admin'));

router.post('/create-organizer', createOrganizer);
router.get('/organizers', getAllOrganizers);
router.delete('/organizers/:id', removeOrganizer);

module.exports = router;