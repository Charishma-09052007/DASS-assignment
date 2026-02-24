const Event = require('../models/Event');

// ===== CREATE EVENT =====
exports.createEvent = async (req, res) => {
    try {
        const { name, description, type, registrationDeadline, startDate, endDate } = req.body;

        // Basic validation
        if (!name || !description || !type || !registrationDeadline || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Please provide: name, description, type, registrationDeadline, startDate, endDate'
            });
        }

        // Date validation
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }

        if (new Date(registrationDeadline) >= new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: 'Registration deadline must be before start date'
            });
        }

        // Merchandise validation
        if (type === 'merchandise') {
            const { items } = req.body;
            if (!items || items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Merchandise events must have at least one item'
                });
            }

            for (let item of items) {
                if (!item.name || !item.price) {
                    return res.status(400).json({
                        success: false,
                        message: 'Each item must have name and price'
                    });
                }
                if (item.variants) {
                    for (let variant of item.variants) {
                        if (!variant.stock || variant.stock < 0) {
                            return res.status(400).json({
                                success: false,
                                message: 'Each variant must have valid stock'
                            });
                        }
                    }
                }
            }
        }

        const eventData = {
            ...req.body,
            organizer: req.user._id,
            status: 'draft'
        };

        const event = await Event.create(eventData);
        res.status(201).json({ success: true, data: event });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== GET ALL EVENTS =====
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'firstName lastName email');
        res.json({ success: true, data: events });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== GET SINGLE EVENT =====
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'firstName lastName email');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, data: event });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== UPDATE EVENT =====
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Check authorization
        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        Object.assign(event, req.body);
        await event.save();
        res.json({ success: true, data: event });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== PUBLISH EVENT =====
exports.publishEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        event.status = 'published';
        await event.save();
        res.json({ success: true, data: event });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// ===== DELETE EVENT =====
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await event.deleteOne();
        res.json({ success: true, message: 'Event deleted successfully' });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};