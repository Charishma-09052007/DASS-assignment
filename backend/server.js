const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
app.use(express.json());

// CORS configuration
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

// Create HTTP server
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    }
});

// ========== MIDDLEWARE ==========

// Verify JWT Token Middleware
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Please login to access this resource'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from database
        const User = mongoose.model('User');
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid token' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
};

// Role-Based Access Control Middleware
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action'
            });
        }
        next();
    };
};

// ========== SCHEMAS ==========

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['admin', 'organizer', 'participant'],
        default: 'participant'
    },
    participantType: { 
        type: String, 
        enum: ['iiit', 'non-iiit', null],
        default: null
    },
    contactNumber: { type: String, required: true },
    collegeName: { type: String },
    interests: { type: [String], default: [] },
    followedClubs: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: [] 
    }],
    onboardingCompleted: { type: Boolean, default: false },
    organizerDetails: {
        organizerName: String,
        category: String,
        description: String,
        contactEmail: String
    },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Event Schema
const eventSchema = new mongoose.Schema({
    eventName: { type: String, required: true, trim: true },
    eventDescription: { type: String, required: true, trim: true },
    eventType: { 
        type: String, 
        required: true, 
        enum: ['normal', 'merchandise'],
        default: 'normal'
    },
    registrationDeadline: { type: Date, required: true },
    registrationFee: { type: Number, required: true, min: 0, default: 0 },
    eventStartDate: { type: Date, required: true },
    eventEndDate: { type: Date, required: true },
    organizerId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    eventTags: [{ type: String, trim: true }],
    eligibility: { 
        type: String, 
        enum: ['everyone', 'iiit-only', 'non-iiit-only'],
        default: 'everyone'
    },
    registrationLimit: { type: Number, min: 1, default: null },
    currentRegistrations: { type: Number, default: 0 },
    customForm: { type: mongoose.Schema.Types.Mixed, default: null },
    itemDetails: {
        name: String,
        description: String,
        variants: [{
            size: String,
            color: String,
            stock: Number,
            price: Number,
            sku: String
        }],
        images: [String],
        purchaseLimitPerUser: { type: Number, default: 1, min: 1 }
    },
    status: { 
        type: String, 
        enum: ['draft', 'published', 'ongoing', 'closed', 'completed'],
        default: 'draft'
    },
    publishedAt: Date,
    closedAt: Date,
    completedAt: Date
}, { timestamps: true });

// Virtual for checking if registration is open
eventSchema.virtual('isRegistrationOpen').get(function() {
    if (this.status !== 'published' && this.status !== 'ongoing') return false;
    if (this.registrationDeadline && new Date() > this.registrationDeadline) return false;
    if (this.registrationLimit && this.currentRegistrations >= this.registrationLimit) return false;
    return true;
});

// Method to check if user can register
eventSchema.methods.canRegister = function(userType) {
    if (!this.isRegistrationOpen) return false;
    if (this.eligibility === 'iiit-only' && userType !== 'iiit') return false;
    if (this.eligibility === 'non-iiit-only' && userType === 'iiit') return false;
    return true;
};

const Event = mongoose.model('Event', eventSchema);

// Registration Schema
const registrationSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    registrationType: { type: String, enum: ['normal', 'merchandise'], required: true },
    status: { 
        type: String, 
        enum: ['registered', 'pending', 'approved', 'rejected', 'cancelled', 'completed', 'attended'],
        default: 'registered'
    },
    formResponses: { type: mongoose.Schema.Types.Mixed, default: null },
    orderDetails: {
        items: [{
            variantId: String,
            size: String,
            color: String,
            quantity: Number,
            price: Number
        }],
        totalAmount: Number,
        paymentProof: String,
        paymentStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        paymentApprovedAt: Date,
        paymentRejectedAt: Date,
        rejectionReason: String
    },
    ticketId: { type: String, unique: true, sparse: true },
    qrCode: { type: String, default: null },
    attendanceMarked: { type: Boolean, default: false },
    attendanceMarkedAt: Date,
    attendanceMarkedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: Date,
    completedAt: Date
}, { timestamps: true });

// Generate unique ticket ID
registrationSchema.pre('save', async function(next) {
    if (!this.ticketId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.ticketId = `TKT-${timestamp}-${random}`;
    }
    next();
});

const Registration = mongoose.model('Registration', registrationSchema);

// ===== FORUM MESSAGE SCHEMA (Tier B) =====
const forumMessageSchema = new mongoose.Schema({
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userRole: { type: String, enum: ['participant', 'organizer', 'admin'], required: true },
    content: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'ForumMessage', default: null },
    isPinned: { type: Boolean, default: false },
    isAnnouncement: { type: Boolean, default: false },
    reactions: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reaction: { type: String, enum: ['👍', '❤️', '😂', '😮', '😢', '😡'] }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false }
});

const ForumMessage = mongoose.model('ForumMessage', forumMessageSchema);

// ===== ORGANIZER PASSWORD RESET SCHEMA =====
const organizerPasswordResetSchema = new mongoose.Schema({
    organizerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clubName: { type: String, required: true },
    reason: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    adminComment: { type: String, default: null },
    newPassword: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
    resolvedAt: { type: Date, default: null }
}, { timestamps: true });

const OrganizerPasswordReset = mongoose.model(
    'OrganizerPasswordReset',
    organizerPasswordResetSchema
);

// ========== TEST ROUTE ==========
app.get('/', (req, res) => {
    res.json({ 
        success: true,
        message: 'API Working with Security!',
        version: '1.0.0'
    });
});

// ========== CREATE ADMIN AND SAMPLE DATA ==========
const createAdminAndSampleData = async () => {
    try {
        // Check if admin exists
        const adminExists = await User.findOne({ email: 'admin@iiit.ac.in' });
        
        if (!adminExists) {
            // Create admin
            const hashedPassword = await bcrypt.hash('Admin@123456', 10);
            const admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@iiit.ac.in',
                password: hashedPassword,
                role: 'admin',
                participantType: null,
                contactNumber: '9999999999',
                collegeName: 'IIIT Hyderabad',
                isActive: true,
                onboardingCompleted: true
            });
            await admin.save();
            console.log('✅ Admin created');
        }

        // Create sample organizers if they don't exist
        const organizers = [
            {
                firstName: 'Music',
                lastName: 'Club',
                email: 'music.club@iiit.ac.in',
                password: await bcrypt.hash('Club@123456', 10),
                role: 'organizer',
                contactNumber: '9999999991',
                organizerDetails: {
                    organizerName: 'Music Club',
                    category: 'cultural',
                    description: 'Official music club of IIIT Hyderabad',
                    contactEmail: 'music.club@iiit.ac.in'
                }
            },
            {
                firstName: 'Coding',
                lastName: 'Club',
                email: 'coding.club@iiit.ac.in',
                password: await bcrypt.hash('Club@123456', 10),
                role: 'organizer',
                contactNumber: '9999999992',
                organizerDetails: {
                    organizerName: 'Coding Club',
                    category: 'technical',
                    description: 'Competitive programming and development club',
                    contactEmail: 'coding.club@iiit.ac.in'
                }
            },
            {
                firstName: 'Sports',
                lastName: 'Council',
                email: 'sports.council@iiit.ac.in',
                password: await bcrypt.hash('Club@123456', 10),
                role: 'organizer',
                contactNumber: '9999999993',
                organizerDetails: {
                    organizerName: 'Sports Council',
                    category: 'sports',
                    description: 'All sports activities and tournaments',
                    contactEmail: 'sports.council@iiit.ac.in'
                }
            }
        ];

        for (let org of organizers) {
            const exists = await User.findOne({ email: org.email });
            if (!exists) {
                await User.create(org);
                console.log(`✅ Created organizer: ${org.organizerDetails.organizerName}`);
            }
        }

        // Create sample events
        const codingClub = await User.findOne({ email: 'coding.club@iiit.ac.in' });
        const musicClub = await User.findOne({ email: 'music.club@iiit.ac.in' });
        const sportsCouncil = await User.findOne({ email: 'sports.council@iiit.ac.in' });

        if (codingClub && musicClub && sportsCouncil) {
            const eventCount = await Event.countDocuments();
            
            if (eventCount === 0) {
                const events = [
                    {
                        eventName: 'Code Sprint 2026',
                        eventDescription: '24-hour competitive programming competition',
                        eventType: 'normal',
                        registrationDeadline: new Date('2026-03-15T23:59:59'),
                        registrationFee: 100,
                        eventStartDate: new Date('2026-03-20T09:00:00'),
                        eventEndDate: new Date('2026-03-21T09:00:00'),
                        organizerId: codingClub._id,
                        eventTags: ['coding', 'competition'],
                        eligibility: 'everyone',
                        registrationLimit: 100,
                        currentRegistrations: 45,
                        status: 'published'
                    },
                    {
                        eventName: 'Battle of Bands',
                        eventDescription: 'Inter-college band competition',
                        eventType: 'normal',
                        registrationDeadline: new Date('2026-04-10T23:59:59'),
                        registrationFee: 500,
                        eventStartDate: new Date('2026-04-15T18:00:00'),
                        eventEndDate: new Date('2026-04-15T23:00:00'),
                        organizerId: musicClub._id,
                        eventTags: ['music', 'cultural'],
                        eligibility: 'everyone',
                        registrationLimit: 20,
                        currentRegistrations: 12,
                        status: 'published'
                    },
                    {
                        eventName: 'Coding Club Hoodies',
                        eventDescription: 'Exclusive coding club hoodies',
                        eventType: 'merchandise',
                        registrationDeadline: new Date('2026-03-15T23:59:59'),
                        registrationFee: 0,
                        eventStartDate: new Date('2026-02-20T00:00:00'),
                        eventEndDate: new Date('2026-03-20T23:59:59'),
                        organizerId: codingClub._id,
                        eventTags: ['merchandise', 'hoodie'],
                        eligibility: 'everyone',
                        status: 'published',
                        itemDetails: {
                            name: 'Coding Club Hoodie',
                            description: 'Premium hoodie with logo',
                            purchaseLimitPerUser: 2,
                            variants: [
                                { size: 'M', color: 'Navy Blue', stock: 30, price: 899, sku: 'HD-NB-M' },
                                { size: 'L', color: 'Navy Blue', stock: 30, price: 899, sku: 'HD-NB-L' }
                            ]
                        }
                    }
                ];

                for (let event of events) {
                    await Event.create(event);
                    console.log(`✅ Created event: ${event.eventName}`);
                }
            }
        }
    } catch (error) {
        console.error('Error creating sample data:', error.message);
    }
};

// ========== AUTH ROUTES ==========

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, contactNumber, collegeName } = req.body;

        if (!firstName || !lastName || !email || !password || !contactNumber) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
        }

        if (!/^\d{10}$/.test(contactNumber)) {
            return res.status(400).json({ success: false, message: 'Enter valid 10-digit phone number' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const isIIIT = email.endsWith('@iiit.ac.in');
        
        if (!isIIIT && (!collegeName || collegeName.trim() === '')) {
            return res.status(400).json({ success: false, message: 'College name is required for non-IIIT participants' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            firstName, lastName, email,
            password: hashedPassword,
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
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({ success: true, token, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        user.password = undefined;
        
        res.json({ success: true, token, data: { user } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get current user
app.get('/api/auth/me', verifyToken, (req, res) => {
    res.json({ success: true, data: { user: req.user } });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully' });
});

// ========== EVENT ROUTES ==========

// Get all events (with filters)
app.get('/api/events', verifyToken, async (req, res) => {
    try {
        const { type, eligibility, search } = req.query;
        let query = { status: 'published' };

        if (type && ['normal', 'merchandise'].includes(type)) {
            query.eventType = type;
        }

        if (eligibility && ['everyone', 'iiit-only', 'non-iiit-only'].includes(eligibility)) {
            query.eligibility = eligibility;
        }

        if (search) {
            query.$or = [
                { eventName: { $regex: search, $options: 'i' } },
                { eventTags: { $in: [new RegExp(search, 'i')] } }
            ];
        }

        const events = await Event.find(query)
            .populate('organizerId', 'firstName lastName email organizerDetails')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single event
app.get('/api/events/:id', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizerId', 'firstName lastName email organizerDetails contactNumber');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        res.json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== UPDATED: Create event with enhanced validation for Task 8 =====
app.post('/api/events', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const eventData = { ...req.body, organizerId: req.user._id };

        // Enhanced validation for merchandise events
        if (eventData.eventType === 'merchandise') {
            if (!eventData.itemDetails) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Merchandise events require item details' 
                });
            }
            
            if (!eventData.itemDetails.variants || eventData.itemDetails.variants.length === 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Merchandise events require at least one variant (size/color)' 
                });
            }
            
            // Validate each variant has required fields
            for (const variant of eventData.itemDetails.variants) {
                if (!variant.size || !variant.color || variant.stock === undefined || variant.price === undefined) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Each variant must have size, color, stock, and price' 
                    });
                }
                if (variant.stock < 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Stock cannot be negative' 
                    });
                }
                if (variant.price < 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Price cannot be negative' 
                    });
                }
            }
            
            // Set default purchase limit if not provided
            if (!eventData.itemDetails.purchaseLimitPerUser) {
                eventData.itemDetails.purchaseLimitPerUser = 1;
            }
        }

        // Validate dates
        const now = new Date();
        const startDate = new Date(eventData.eventStartDate);
        const endDate = new Date(eventData.eventEndDate);
        const deadline = new Date(eventData.registrationDeadline);

        if (deadline < now) {
            return res.status(400).json({ 
                success: false, 
                message: 'Registration deadline must be in the future' 
            });
        }

        if (startDate < deadline) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event start date must be after registration deadline' 
            });
        }

        if (endDate < startDate) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event end date must be after start date' 
            });
        }

        const event = await Event.create(eventData);
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update event (organizer and admin)
app.put('/api/events/:id', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check ownership - Admin can update any event
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (req.body.eventType && req.body.eventType !== event.eventType) {
            return res.status(400).json({ success: false, message: 'Event type cannot be changed' });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({ success: true, data: updatedEvent });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Publish event (organizer and admin)
app.patch('/api/events/:id/publish', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check ownership - Admin can publish any event
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Only draft events can be published' });
        }

        event.status = 'published';
        event.publishedAt = new Date();
        await event.save();

        res.json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Delete event (organizer and admin)
app.delete('/api/events/:id', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check ownership - Admin can delete any event
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (event.status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Only draft events can be deleted' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Event deleted successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get events by type
app.get('/api/events/type/:type', verifyToken, async (req, res) => {
    try {
        const { type } = req.params;
        
        if (!['normal', 'merchandise'].includes(type)) {
            return res.status(400).json({ success: false, message: 'Invalid event type' });
        }

        const events = await Event.find({ eventType: type, status: 'published' })
            .populate('organizerId', 'organizerDetails');

        res.json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== NEW ROUTE 1: Get event with full details including stock for Task 8 =====
app.get('/api/events/:id/details', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizerId', 'firstName lastName email organizerDetails');

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Add computed fields
        const eventObj = event.toObject();
        
        if (event.eventType === 'merchandise') {
            // Calculate total stock
            eventObj.totalStock = event.itemDetails.variants.reduce((sum, v) => sum + v.stock, 0);
            
            // Check if any variant is in stock
            eventObj.inStock = event.itemDetails.variants.some(v => v.stock > 0);
            
            // Get available variants
            eventObj.availableVariants = event.itemDetails.variants.filter(v => v.stock > 0);
        }

        res.json({ success: true, data: eventObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ===== NEW ROUTE 2: Check stock for merchandise event for Task 8 =====
app.get('/api/events/:eventId/stock', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.eventType !== 'merchandise') {
            return res.status(400).json({ 
                success: false, 
                message: 'Stock information only available for merchandise events' 
            });
        }

        const stockInfo = {
            eventName: event.eventName,
            totalStock: event.itemDetails.variants.reduce((sum, v) => sum + v.stock, 0),
            variants: event.itemDetails.variants.map(v => ({
                size: v.size,
                color: v.color,
                stock: v.stock,
                price: v.price,
                sku: v.sku,
                inStock: v.stock > 0
            }))
        };

        res.json({ success: true, data: stockInfo });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== REGISTRATION ROUTES ==========

// Register for event
app.post('/api/events/:eventId/register', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { formResponses, orderDetails } = req.body;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!event.canRegister(req.user.participantType)) {
            return res.status(400).json({ success: false, message: 'Registration not open or you are not eligible' });
        }

        const existingRegistration = await Registration.findOne({
            eventId,
            participantId: req.user._id,
            status: { $in: ['registered', 'approved', 'pending'] }
        });

        if (existingRegistration) {
            return res.status(400).json({ success: false, message: 'Already registered' });
        }

        if (event.eventType === 'merchandise') {
            if (!orderDetails?.items?.length) {
                return res.status(400).json({ success: false, message: 'Please select items' });
            }

            let totalAmount = 0;
            for (const item of orderDetails.items) {
                const variant = event.itemDetails.variants.id(item.variantId);
                if (!variant) {
                    return res.status(400).json({ success: false, message: 'Invalid variant' });
                }
                if (variant.stock < item.quantity) {
                    return res.status(400).json({ success: false, message: 'Insufficient stock' });
                }
                totalAmount += variant.price * item.quantity;
            }
            orderDetails.totalAmount = totalAmount;
        }

        const registration = await Registration.create({
            eventId,
            participantId: req.user._id,
            registrationType: event.eventType,
            status: event.eventType === 'merchandise' ? 'pending' : 'registered',
            formResponses,
            orderDetails: event.eventType === 'merchandise' ? orderDetails : undefined
        });

        if (event.eventType !== 'merchandise') {
            event.currentRegistrations += 1;
            await event.save();
        }

        res.status(201).json({ success: true, data: registration });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get user's registrations
app.get('/api/user/registrations', verifyToken, async (req, res) => {
    try {
        const registrations = await Registration.find({ participantId: req.user._id })
            .populate({ path: 'eventId', populate: { path: 'organizerId', select: 'organizerDetails' } })
            .sort({ registeredAt: -1 });

        res.json({ success: true, count: registrations.length, data: registrations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get event registrations (organizer and admin)
app.get('/api/events/:eventId/registrations', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check ownership - Admin can view any registrations
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email contactNumber collegeName')
            .sort({ registeredAt: -1 });

        res.json({ success: true, count: registrations.length, data: registrations });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== DASHBOARD ROUTES ==========

// Participant Dashboard
app.get('/api/participant/dashboard', verifyToken, restrictTo('participant'), async (req, res) => {
    try {
        const upcomingEvents = await Registration.find({ 
            participantId: req.user._id,
            status: { $in: ['registered', 'approved'] }
        })
        .populate({ path: 'eventId', match: { eventEndDate: { $gte: new Date() } } })
        .limit(5);

        res.json({ 
            success: true, 
            data: { 
                user: req.user,
                upcomingEvents: upcomingEvents.filter(r => r.eventId)
            } 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Organizer Dashboard (organizer and admin)
app.get('/api/organizer/dashboard', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user._id }).sort({ createdAt: -1 });
        res.json({ success: true, data: { user: req.user, events } });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Admin Dashboard
app.get('/api/admin/dashboard', verifyToken, restrictTo('admin'), (req, res) => {
    res.json({ success: true, data: { user: req.user } });
});

// ========== USER PROFILE ROUTES ==========

// Get profile
app.get('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('followedClubs', 'firstName lastName email organizerDetails');
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Update interests
app.put('/api/users/interests', verifyToken, async (req, res) => {
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
});

// ===== NEW ROUTE 3: Update full profile =====
app.put('/api/users/profile', verifyToken, async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, collegeName, interests } = req.body;
        
        const updates = {
            firstName,
            lastName,
            contactNumber,
            collegeName,
            interests
        };
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ===== NEW ROUTE 4: Change password =====
app.put('/api/users/password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Get user with password
        const user = await User.findById(req.user._id).select('+password');
        
        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password
        user.password = hashedPassword;
        await user.save();
        
        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all clubs
app.get('/api/users/clubs', verifyToken, async (req, res) => {
    try {
        const clubs = await User.find({ role: 'organizer', isActive: true })
            .select('firstName lastName email organizerDetails');
        res.json({ success: true, count: clubs.length, data: clubs });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Follow/Unfollow club
app.post('/api/users/follow/:clubId', verifyToken, async (req, res) => {
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
            message: isFollowing ? 'Unfollowed' : 'Followed',
            data: { followedClubs: user.followedClubs }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Onboarding status
app.get('/api/users/onboarding-status', verifyToken, (req, res) => {
    res.json({
        success: true,
        data: {
            onboardingCompleted: req.user.onboardingCompleted,
            interests: req.user.interests,
            followedClubs: req.user.followedClubs
        }
    });
});

// Skip onboarding
app.post('/api/users/skip-onboarding', verifyToken, async (req, res) => {
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
});

// ========== TASK 10: ORGANIZER ROUTES ==========

// Get organizer's events with analytics
app.get('/api/organizer/events', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const events = await Event.find({ organizerId: req.user._id })
            .sort({ createdAt: -1 });
        
        // Get analytics for completed events
        const completedEvents = events.filter(e => e.status === 'completed');
        const analytics = {
            totalRegistrations: 0,
            totalRevenue: 0,
            totalAttendance: 0
        };
        
        for (const event of completedEvents) {
            const registrations = await Registration.find({ 
                eventId: event._id,
                status: { $in: ['registered', 'approved', 'completed', 'attended'] }
            });
            
            analytics.totalRegistrations += registrations.length;
            analytics.totalRevenue += registrations.reduce((sum, r) => {
                return sum + (r.orderDetails?.totalAmount || 0);
            }, 0);
            analytics.totalAttendance += registrations.filter(r => r.attendanceMarked).length;
        }
        
        res.json({ 
            success: true, 
            data: { 
                events,
                analytics 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update event status
app.patch('/api/events/:id/status', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { status } = req.body;
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        // Validate status transitions
        const validTransitions = {
            'draft': ['published'],
            'published': ['ongoing', 'closed'],
            'ongoing': ['completed', 'closed'],
            'closed': ['published'],
            'completed': []
        };
        
        if (!validTransitions[event.status]?.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: `Cannot change status from ${event.status} to ${status}` 
            });
        }
        
        event.status = status;
        if (status === 'published') event.publishedAt = new Date();
        if (status === 'completed') event.completedAt = new Date();
        if (status === 'closed') event.closedAt = new Date();
        
        await event.save();
        res.json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get event participants with filters (UPDATED to include ticketId)
app.get('/api/events/:eventId/participants', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { search, status, payment } = req.query;
        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        let query = { eventId: req.params.eventId };
        
        if (status) query.status = status;
        if (payment) query['orderDetails.paymentStatus'] = payment;
        
        const registrations = await Registration.find(query)
            .populate('participantId', 'firstName lastName email contactNumber collegeName')
            .select('+ticketId')
            .sort({ registeredAt: -1 });
        
        let filtered = registrations;
        if (search) {
            filtered = registrations.filter(r => 
                r.participantId.firstName.toLowerCase().includes(search.toLowerCase()) ||
                r.participantId.lastName.toLowerCase().includes(search.toLowerCase()) ||
                r.participantId.email.toLowerCase().includes(search.toLowerCase())
            );
        }
        
        const transformedData = filtered.map(r => ({
            ...r.toObject(),
            ticketId: r.ticketId
        }));
        
        res.json({ 
            success: true, 
            count: transformedData.length,
            data: transformedData 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export participants as CSV
app.get('/api/events/:eventId/participants/export', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const registrations = await Registration.find({ eventId: req.params.eventId })
            .populate('participantId', 'firstName lastName email contactNumber collegeName');
        
        const csv = [
            ['Name', 'Email', 'Contact', 'College', 'Registration Date', 'Status', 'Payment', 'Team', 'Attendance', 'Ticket ID'].join(','),
            ...registrations.map(r => [
                `${r.participantId.firstName} ${r.participantId.lastName}`,
                r.participantId.email,
                r.participantId.contactNumber,
                r.participantId.collegeName || 'N/A',
                new Date(r.registeredAt).toLocaleDateString(),
                r.status,
                r.orderDetails?.paymentStatus || 'N/A',
                r.formResponses?.teamName || 'N/A',
                r.attendanceMarked ? 'Yes' : 'No',
                r.ticketId || 'N/A'
            ].join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=participants-${event.eventName}.csv`);
        res.send(csv);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update organizer profile
app.put('/api/organizer/profile', verifyToken, restrictTo('organizer'), async (req, res) => {
    try {
        const { firstName, lastName, contactNumber, organizerDetails } = req.body;
        
        const updates = {
            firstName,
            lastName,
            contactNumber,
            organizerDetails
        };
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Set Discord webhook
app.post('/api/organizer/discord-webhook', verifyToken, restrictTo('organizer'), async (req, res) => {
    try {
        const { webhookUrl } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { 'organizerDetails.discordWebhook': webhookUrl },
            { new: true }
        ).select('-password');
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ========== TASK 11: ADMIN ROUTES ==========

// Get all clubs/organizers (for admin)
app.get('/api/admin/clubs', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const clubs = await User.find({ 
            role: 'organizer',
            isActive: true 
        }).select('firstName lastName email organizerDetails createdAt isActive');
        
        res.json({ success: true, count: clubs.length, data: clubs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all deleted/archived clubs
app.get('/api/admin/clubs/deleted', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const clubs = await User.find({ 
            role: 'organizer',
            isActive: false 
        }).select('firstName lastName email organizerDetails createdAt isActive');
        
        res.json({ success: true, count: clubs.length, data: clubs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Create new club/organizer (admin only)
app.post('/api/admin/clubs', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const { organizerName, category, description, contactEmail } = req.body;
        
        const randomPassword = Math.random().toString(36).slice(-8) + 
                               Math.random().toString(36).slice(-8).toUpperCase();
        
        const baseEmail = organizerName.toLowerCase().replace(/\s+/g, '.') + '@iiit.ac.in';
        
        const existingUser = await User.findOne({ email: baseEmail });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'Club with this email already exists' 
            });
        }

        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        const names = organizerName.split(' ');
        const firstName = names[0] || 'Club';
        const lastName = names.slice(1).join(' ') || 'Organizer';

        const newClub = new User({
            firstName,
            lastName,
            email: baseEmail,
            password: hashedPassword,
            role: 'organizer',
            contactNumber: '0000000000',
            organizerDetails: {
                organizerName,
                category,
                description,
                contactEmail: contactEmail || baseEmail
            },
            isActive: true,
            onboardingCompleted: true
        });
        
        await newClub.save();
        
        res.json({ 
            success: true, 
            message: 'Club created successfully',
            data: {
                club: newClub,
                credentials: {
                    email: baseEmail,
                    password: randomPassword
                }
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Disable/Archive club
app.patch('/api/admin/clubs/:id/disable', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const club = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        ).select('-password');
        
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Club disabled successfully',
            data: club 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Restore club
app.patch('/api/admin/clubs/:id/restore', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const club = await User.findByIdAndUpdate(
            req.params.id,
            { isActive: true },
            { new: true }
        ).select('-password');
        
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Club restored successfully',
            data: club 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Permanently delete club
app.delete('/api/admin/clubs/:id', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const club = await User.findByIdAndDelete(req.params.id);
        
        if (!club) {
            return res.status(404).json({ success: false, message: 'Club not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Club permanently deleted' 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// ========== ORGANIZER PASSWORD RESET ROUTES ==========

// 1. Request password reset (Organizer)
app.post('/api/organizer/password-reset/request', verifyToken, restrictTo('organizer'), async (req, res) => {
    try {
        const { reason } = req.body;
        
        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for password reset'
            });
        }

        // Check if there's already a pending request
        const existingRequest = await OrganizerPasswordReset.findOne({
            organizerId: req.user._id,
            status: 'pending'
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending password reset request. Please wait for admin approval.'
            });
        }

        // Get club name from organizer details
        const clubName = req.user.organizerDetails?.organizerName || 
                        `${req.user.firstName} ${req.user.lastName}`;

        const resetRequest = await OrganizerPasswordReset.create({
            organizerId: req.user._id,
            clubName: clubName,
            reason: reason,
            status: 'pending',
            requestedAt: new Date()
        });

        // Populate organizer details for response
        await resetRequest.populate('organizerId', 'firstName lastName email organizerDetails');

        res.status(201).json({
            success: true,
            message: 'Password reset request submitted successfully',
            data: resetRequest
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 2. Get all password reset requests (Admin)
app.get('/api/admin/password-reset-requests', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        
        let query = {};
        if (status && ['pending', 'approved', 'rejected'].includes(status)) {
            query.status = status;
        }

        const requests = await OrganizerPasswordReset.find(query)
            .populate('organizerId', 'firstName lastName email organizerDetails contactNumber')
            .sort({ requestedAt: -1 });

        res.json({
            success: true,
            count: requests.length,
            data: requests
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 3. Get single password reset request (Admin)
app.get('/api/admin/password-reset-requests/:requestId', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;

        const request = await OrganizerPasswordReset.findById(requestId)
            .populate('organizerId', 'firstName lastName email organizerDetails contactNumber');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Password reset request not found'
            });
        }

        res.json({
            success: true,
            data: request
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 4. Approve password reset request (Admin)
app.post('/api/admin/password-reset-requests/:requestId/approve', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminComment } = req.body;

        const resetRequest = await OrganizerPasswordReset.findById(requestId)
            .populate('organizerId');

        if (!resetRequest) {
            return res.status(404).json({
                success: false,
                message: 'Password reset request not found'
            });
        }

        if (resetRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `This request is already ${resetRequest.status}`
            });
        }

        // Generate new random password
        const newPassword = Math.random().toString(36).slice(-8) + 
                           Math.random().toString(36).slice(-8).toUpperCase() + 
                           '!@#' + Math.floor(Math.random() * 100);

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update organizer's password
        await User.findByIdAndUpdate(resetRequest.organizerId._id, {
            password: hashedPassword
        });

        // Update reset request
        resetRequest.status = 'approved';
        resetRequest.adminComment = adminComment || 'Password reset approved by admin';
        resetRequest.newPassword = newPassword; // Store plain password for admin to see (will be returned in response)
        resetRequest.resolvedAt = new Date();
        await resetRequest.save();

        // Return the new password in response (admin will share it with organizer)
        res.json({
            success: true,
            message: 'Password reset request approved',
            data: {
                _id: resetRequest._id,
                clubName: resetRequest.clubName,
                status: resetRequest.status,
                adminComment: resetRequest.adminComment,
                newPassword: newPassword, // Send plain password to admin
                resolvedAt: resetRequest.resolvedAt,
                organizer: {
                    name: `${resetRequest.organizerId.firstName} ${resetRequest.organizerId.lastName}`,
                    email: resetRequest.organizerId.email
                }
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 5. Reject password reset request (Admin)
app.post('/api/admin/password-reset-requests/:requestId/reject', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const { requestId } = req.params;
        const { adminComment } = req.body;

        if (!adminComment || adminComment.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Please provide a reason for rejection'
            });
        }

        const resetRequest = await OrganizerPasswordReset.findById(requestId)
            .populate('organizerId');

        if (!resetRequest) {
            return res.status(404).json({
                success: false,
                message: 'Password reset request not found'
            });
        }

        if (resetRequest.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `This request is already ${resetRequest.status}`
            });
        }

        // Update reset request
        resetRequest.status = 'rejected';
        resetRequest.adminComment = adminComment;
        resetRequest.resolvedAt = new Date();
        await resetRequest.save();

        res.json({
            success: true,
            message: 'Password reset request rejected',
            data: {
                _id: resetRequest._id,
                clubName: resetRequest.clubName,
                status: resetRequest.status,
                adminComment: resetRequest.adminComment,
                resolvedAt: resetRequest.resolvedAt
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 6. Get password reset history for an organizer (Admin/Organizer)
app.get('/api/organizer/password-reset-history', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'organizer') {
            // Organizer can only see their own history
            query.organizerId = req.user._id;
        } else if (req.user.role === 'admin' && req.query.organizerId) {
            // Admin can see specific organizer's history
            query.organizerId = req.query.organizerId;
        }

        const history = await OrganizerPasswordReset.find(query)
            .populate('organizerId', 'firstName lastName email organizerDetails')
            .sort({ requestedAt: -1 });

        res.json({
            success: true,
            count: history.length,
            data: history
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 7. Get password reset statistics (Admin)
app.get('/api/admin/password-reset-stats', verifyToken, restrictTo('admin'), async (req, res) => {
    try {
        const stats = await OrganizerPasswordReset.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const totalRequests = await OrganizerPasswordReset.countDocuments();
        
        // Get recent activity
        const recentActivity = await OrganizerPasswordReset.find()
            .populate('organizerId', 'firstName lastName email')
            .sort({ requestedAt: -1 })
            .limit(5);

        res.json({
            success: true,
            data: {
                total: totalRequests,
                byStatus: stats.reduce((acc, curr) => {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {}),
                recentActivity
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== TASK 13: CALENDAR INTEGRATION (Tier C) ==========

// Generate .ics file for event
app.get('/api/events/:id/calendar', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const startDate = new Date(event.eventStartDate);
        const endDate = new Date(event.eventEndDate);
        
        const formatDate = (date) => {
            return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Fest Management//EN
BEGIN:VEVENT
UID:${event._id}@festmanagement.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${event.eventName}
DESCRIPTION:${event.eventDescription.replace(/\n/g, '\\n')}
LOCATION:Fest Grounds
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', `attachment; filename="${event.eventName}.ics"`);
        res.send(icsContent);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get Google Calendar link
app.get('/api/events/:id/google-calendar-link', verifyToken, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const startDate = new Date(event.eventStartDate);
        const endDate = new Date(event.eventEndDate);
        
        const formatGoogleDate = (date) => {
            return date.toISOString().replace(/-|:|\.\d+/g, '');
        };

        const googleLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.eventName)}&dates=${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}&details=${encodeURIComponent(event.eventDescription)}&location=Fest%20Grounds&sf=true&output=xml`;
        
        res.json({ success: true, data: { googleLink } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== TASK 13: QR SCANNER & ATTENDANCE TRACKING (Tier A) ==========

// Mark attendance by scanning QR code
app.post('/api/events/:eventId/attendance/scan', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        const { ticketId } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const registration = await Registration.findOne({ 
            eventId,
            ticketId 
        }).populate('participantId', 'firstName lastName email');
        
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Invalid ticket' });
        }
        
        if (registration.attendanceMarked) {
            return res.status(400).json({ 
                success: false, 
                message: 'Attendance already marked',
                data: {
                    markedAt: registration.attendanceMarkedAt,
                    participant: registration.participantId
                }
            });
        }
        
        registration.attendanceMarked = true;
        registration.attendanceMarkedAt = new Date();
        registration.attendanceMarkedBy = req.user._id;
        await registration.save();
        
        res.json({ 
            success: true, 
            message: 'Attendance marked successfully',
            data: {
                participant: registration.participantId,
                markedAt: registration.attendanceMarkedAt
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Manual override for attendance
app.post('/api/events/:eventId/attendance/manual', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        const { participantId, reason } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const registration = await Registration.findOne({ 
            eventId,
            participantId 
        }).populate('participantId', 'firstName lastName email');
        
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }
        
        if (registration.attendanceMarked) {
            return res.status(400).json({ success: false, message: 'Attendance already marked' });
        }
        
        registration.attendanceMarked = true;
        registration.attendanceMarkedAt = new Date();
        registration.attendanceMarkedBy = req.user._id;
        await registration.save();
        
        console.log(`MANUAL ATTENDANCE: ${req.user.email} marked ${registration.participantId.email} for ${event.eventName}. Reason: ${reason}`);
        
        res.json({ 
            success: true, 
            message: 'Attendance marked manually',
            data: {
                participant: registration.participantId,
                markedAt: registration.attendanceMarkedAt
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get live attendance dashboard
app.get('/api/events/:eventId/attendance/dashboard', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email')
            .select('+ticketId')
            .sort({ registeredAt: -1 });
        
        const scanned = registrations.filter(r => r.attendanceMarked);
        const notScanned = registrations.filter(r => !r.attendanceMarked);
        
        const scannedWithTicket = scanned.map(r => ({
            ...r.toObject(),
            ticketId: r.ticketId
        }));
        
        const notScannedWithTicket = notScanned.map(r => ({
            ...r.toObject(),
            ticketId: r.ticketId
        }));
        
        res.json({
            success: true,
            data: {
                total: registrations.length,
                scanned: {
                    count: scanned.length,
                    list: scannedWithTicket
                },
                notScanned: {
                    count: notScanned.length,
                    list: notScannedWithTicket
                }
            }
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export attendance report
app.get('/api/events/:eventId/attendance/export', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const registrations = await Registration.find({ eventId })
            .populate('participantId', 'firstName lastName email');
        
        const csv = [
            ['Name', 'Email', 'Registration Date', 'Attendance Status', 'Scanned At', 'Ticket ID'].join(','),
            ...registrations.map(r => [
                `${r.participantId.firstName} ${r.participantId.lastName}`,
                r.participantId.email,
                new Date(r.registeredAt).toLocaleString(),
                r.attendanceMarked ? 'Present' : 'Absent',
                r.attendanceMarkedAt ? new Date(r.attendanceMarkedAt).toLocaleString() : 'N/A',
                r.ticketId || 'N/A'
            ].join(','))
        ].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${event.eventName}.csv`);
        res.send(csv);
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== TASK 13: MERCHANDISE PAYMENT APPROVAL (Tier A) ==========

// Get pending merchandise orders for an event
app.get('/api/events/:eventId/orders/pending', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        const pendingOrders = await Registration.find({ 
            eventId,
            registrationType: 'merchandise',
            status: 'pending',
            'orderDetails.paymentStatus': 'pending'
        })
        .populate('participantId', 'firstName lastName email contactNumber')
        .sort({ registeredAt: -1 });
        
        res.json({
            success: true,
            count: pendingOrders.length,
            data: pendingOrders
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approve payment for an order
app.post('/api/orders/:orderId/approve', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { orderId } = req.params;
        
        const registration = await Registration.findById(orderId)
            .populate('participantId')
            .populate('eventId');
        
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const event = await Event.findById(registration.eventId);
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        if (registration.registrationType !== 'merchandise') {
            return res.status(400).json({ success: false, message: 'Not a merchandise order' });
        }
        
        if (registration.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Order is not in pending state' });
        }
        
        registration.status = 'approved';
        registration.orderDetails.paymentStatus = 'approved';
        registration.orderDetails.paymentApprovedAt = new Date();
        
        for (const item of registration.orderDetails.items) {
            await Event.updateOne(
                { 
                    _id: registration.eventId,
                    'itemDetails.variants._id': item.variantId 
                },
                { 
                    $inc: { 'itemDetails.variants.$.stock': -item.quantity }
                }
            );
        }
        
        await registration.save();
        
        res.json({
            success: true,
            message: 'Payment approved successfully',
            data: registration
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Reject payment for an order
app.post('/api/orders/:orderId/reject', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        
        const registration = await Registration.findById(orderId)
            .populate('participantId')
            .populate('eventId');
        
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        const event = await Event.findById(registration.eventId);
        if (req.user.role !== 'admin' && event.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        if (registration.registrationType !== 'merchandise') {
            return res.status(400).json({ success: false, message: 'Not a merchandise order' });
        }
        
        if (registration.status !== 'pending') {
            return res.status(400).json({ success: false, message: 'Order is not in pending state' });
        }
        
        registration.status = 'rejected';
        registration.orderDetails.paymentStatus = 'rejected';
        registration.orderDetails.paymentRejectedAt = new Date();
        registration.orderDetails.rejectionReason = reason || 'No reason provided';
        
        await registration.save();
        
        res.json({
            success: true,
            message: 'Payment rejected',
            data: registration
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload payment proof
app.post('/api/orders/:orderId/upload-proof', verifyToken, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { paymentProof } = req.body;
        
        const registration = await Registration.findById(orderId);
        
        if (!registration) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        
        if (registration.participantId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        if (registration.registrationType !== 'merchandise') {
            return res.status(400).json({ success: false, message: 'Not a merchandise order' });
        }
        
        registration.orderDetails.paymentProof = paymentProof;
        await registration.save();
        
        res.json({
            success: true,
            message: 'Payment proof uploaded successfully'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// ========== TASK 13: REAL-TIME DISCUSSION FORUM (Tier B) ==========

// Get all forum messages for an event
app.get('/api/forum/:eventId', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        
        const messages = await ForumMessage.find({ 
            eventId, 
            isDeleted: false 
        })
        .sort({ createdAt: -1 })
        .populate('userId', 'firstName lastName email role');
        
        const threads = {};
        const topLevelMessages = [];
        
        messages.forEach(msg => {
            if (!msg.parentId) {
                topLevelMessages.push(msg);
            } else {
                if (!threads[msg.parentId]) {
                    threads[msg.parentId] = [];
                }
                threads[msg.parentId].push(msg);
            }
        });
        
        res.json({
            success: true,
            data: {
                messages: topLevelMessages,
                threads: threads
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Post a new message
app.post('/api/forum/:eventId', verifyToken, async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, parentId, isAnnouncement } = req.body;
        
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        if (req.user.role === 'participant') {
            const registration = await Registration.findOne({
                eventId,
                participantId: req.user._id,
                status: { $in: ['registered', 'approved', 'attended'] }
            });
            
            if (!registration && req.user.role !== 'organizer' && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You must be registered to post in the forum' 
                });
            }
        }
        
        if (isAnnouncement && req.user.role === 'organizer') {
            if (event.organizerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Not authorized to post announcements' 
                });
            }
        }
        
        const message = new ForumMessage({
            eventId,
            userId: req.user._id,
            userName: `${req.user.firstName} ${req.user.lastName}`,
            userRole: req.user.role,
            content,
            parentId: parentId || null,
            isAnnouncement: isAnnouncement && (req.user.role === 'organizer' || req.user.role === 'admin')
        });
        
        await message.save();
        
        await message.populate('userId', 'firstName lastName email role');
        
        io.to(`event-${eventId}`).emit('new-message', message);
        
        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Pin/Unpin message
app.patch('/api/forum/:messageId/pin', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { messageId } = req.params;
        const { isPinned } = req.body;
        
        const message = await ForumMessage.findById(messageId).populate('eventId');
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        if (req.user.role !== 'admin' && message.eventId.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        message.isPinned = isPinned;
        await message.save();
        
        io.to(`event-${message.eventId._id}`).emit('message-pinned', { messageId, isPinned });
        
        res.json({ success: true, message: `Message ${isPinned ? 'pinned' : 'unpinned'}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete message
app.delete('/api/forum/:messageId', verifyToken, restrictTo('organizer', 'admin'), async (req, res) => {
    try {
        const { messageId } = req.params;
        
        const message = await ForumMessage.findById(messageId).populate('eventId');
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        if (req.user.role !== 'admin' && message.eventId.organizerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        
        message.isDeleted = true;
        await message.save();
        
        io.to(`event-${message.eventId._id}`).emit('message-deleted', messageId);
        
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Add reaction to message
app.post('/api/forum/:messageId/react', verifyToken, async (req, res) => {
    try {
        const { messageId } = req.params;
        const { reaction } = req.body;
        
        const message = await ForumMessage.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        
        const existingReaction = message.reactions.find(
            r => r.userId.toString() === req.user._id.toString() && r.reaction === reaction
        );
        
        if (existingReaction) {
            message.reactions = message.reactions.filter(
                r => !(r.userId.toString() === req.user._id.toString() && r.reaction === reaction)
            );
        } else {
            message.reactions.push({
                userId: req.user._id,
                reaction
            });
        }
        
        await message.save();
        
        io.to(`event-${message.eventId}`).emit('message-updated', message);
        
        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('join-event', (eventId) => {
        socket.join(`event-${eventId}`);
        console.log(`Client joined event room: event-${eventId}`);
    });
    
    socket.on('leave-event', (eventId) => {
        socket.leave(`event-${eventId}`);
        console.log(`Client left event room: event-${eventId}`);
    });
    
    socket.on('typing', ({ eventId, userId, userName }) => {
        socket.to(`event-${eventId}`).emit('user-typing', { userId, userName });
    });
    
    socket.on('stop-typing', ({ eventId, userId }) => {
        socket.to(`event-${eventId}`).emit('user-stopped-typing', { userId });
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// ========== DEBUG ROUTES ==========

// Get all users (debug)
app.get('/api/test/interests', async (req, res) => {
    try {
        const users = await User.find().select('firstName email role organizerDetails');
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get all events (debug)
app.get('/api/test/events', async (req, res) => {
    try {
        const events = await Event.find().populate('organizerId', 'organizerDetails');
        res.json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete all users (debug)
app.delete('/api/test/delete-all-users', async (req, res) => {
    try {
        const result = await User.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} users` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete all events (debug)
app.delete('/api/test/delete-all-events', async (req, res) => {
    try {
        const result = await Event.deleteMany({});
        await Registration.deleteMany({});
        res.json({ success: true, message: `Deleted ${result.deletedCount} events` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Make user organizer (debug)
app.patch('/api/debug/make-organizer', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOneAndUpdate(
            { email },
            { 
                role: 'organizer',
                organizerDetails: {
                    organizerName: email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                    category: 'technical',
                    description: 'Official club',
                    contactEmail: email
                }
            },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ===== DEBUG: Check stored password =====
app.get('/api/debug/check-password/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({
            success: true,
            data: {
                email: user.email,
                role: user.role,
                passwordHash: user.password, // This shows the hashed password
                // Don't worry, this is just for debugging
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// ========== START SERVER ==========
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server with Socket.io
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fest-management')
    .then(async () => {
        console.log('✅ MongoDB Connected');
        
        await createAdminAndSampleData();
        
        server.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`📝 Test Credentials:`);
            console.log(`   Admin: admin@iiit.ac.in / Admin@123456`);
            console.log(`   Organizer: coding.club@iiit.ac.in / Club@123456`);
            console.log(`   Organizer: music.club@iiit.ac.in / Club@123456`);
            console.log(`\n✅ Task 7 (Event Types) is ready!`);
            console.log(`✅ Task 8 (Event Attributes) is ready!`);
            console.log(`✅ Task 10 (Organizer Features) routes added!`);
            console.log(`✅ Task 11 (Admin Features) routes added!`);
            console.log(`✅ Task 13 (Calendar Integration) added!`);
            console.log(`✅ Task 13 (QR Scanner & Attendance) added!`);
            console.log(`✅ Task 13 (Merchandise Payment) added!`);
            console.log(`✅ Task 13 (Real-Time Discussion Forum) added!`);
            console.log(`✅ Organizer Password Reset Workflow (6 Marks) added!\n`);
            console.log(`📋 Password Reset Routes:`);
            console.log(`   POST   /api/organizer/password-reset/request - Organizer requests reset`);
            console.log(`   GET    /api/admin/password-reset-requests - Admin views all requests`);
            console.log(`   GET    /api/admin/password-reset-requests/:id - Admin views single request`);
            console.log(`   POST   /api/admin/password-reset-requests/:id/approve - Admin approves`);
            console.log(`   POST   /api/admin/password-reset-requests/:id/reject - Admin rejects`);
            console.log(`   GET    /api/organizer/password-reset-history - View history`);
            console.log(`   GET    /api/admin/password-reset-stats - Admin statistics\n`);
        });
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });