// backend/routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Mock authentication middleware for now (replace with your actual auth middleware)
const authenticate = (req, res, next) => {
  // Temporary: add mock user for testing
  req.user = { id: 'test-user-id', role: 'participant' };
  next();
};

const authorize = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }
    next();
  };
};

// Get all events with filtering
router.get('/', authenticate, async (req, res) => {
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
      .populate('organizerId', 'organizerName category')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching events'
    });
  }
});

// Get single event by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizerId', 'organizerName category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching event'
    });
  }
});

// Create event (Organizer only)
router.post('/', authenticate, authorize(['organizer']), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizerId: req.user.id
    };

    // Validate event type specific fields
    if (eventData.eventType === 'merchandise') {
      if (!eventData.itemDetails || !eventData.itemDetails.variants) {
        return res.status(400).json({
          success: false,
          message: 'Merchandise events require item details and variants'
        });
      }
    }

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating event'
    });
  }
});

// Update event (Organizer only)
router.put('/:id', authenticate, authorize(['organizer']), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if organizer owns this event
    if (event.organizerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    // Prevent type change after creation
    if (req.body.eventType && req.body.eventType !== event.eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type cannot be changed after creation'
      });
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating event'
    });
  }
});

// Get events by type
router.get('/type/:type', authenticate, async (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['normal', 'merchandise'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type'
      });
    }

    const events = await Event.find({ 
      eventType: type,
      status: 'published'
    }).populate('organizerId', 'organizerName');

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching events by type'
    });
  }
});

// Get trending events (Top 5 in last 24h)
router.get('/trending/all', authenticate, async (req, res) => {
  try {
    // This is a mock response - implement based on your registration model
    const events = await Event.find({ status: 'published' })
      .limit(5)
      .sort({ currentRegistrations: -1 });
    
    res.json({
      success: true,
      data: events.map(event => ({
        _id: event._id,
        eventName: event.eventName,
        registrations: event.currentRegistrations || 0
      }))
    });
  } catch (error) {
    console.error('Error fetching trending events:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching trending events'
    });
  }
});

module.exports = router;