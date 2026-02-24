const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Please provide valid email']
    },
    password: {
        type: String,
        required: true,
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['participant', 'organizer', 'admin'],
        default: 'participant'
    },
    participantType: {
        type: String,
        enum: ['iiit', 'non-iiit', null],
        default: null
    },
    collegeName: String,
    contactNumber: String,

    isActive: {
        type: Boolean,
        default: true
    },

    // ================= TASK 5: USER ONBOARDING & PREFERENCES =================

    interests: {
        type: [String],
        enum: ['technical', 'cultural', 'sports', 'workshop', 'seminar', 'hackathon'],
        default: []
    },

    followedClubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    onboardingCompleted: {
        type: Boolean,
        default: false
    },   // ✅ <-- COMMA WAS MISSING HERE
    isActive: {
        type: Boolean,
        default: true
    }

    // ================= END TASK 5 =================

}, { timestamps: true });


// ================= PASSWORD HASHING (Task 4 - DO NOT TOUCH) =================
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// ================= PASSWORD COMPARE METHOD =================
userSchema.methods.comparePassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

module.exports = mongoose.model('User', userSchema);
