// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true
  },
  eventDescription: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: ['normal', 'merchandise'],
    default: 'normal'
  },
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },
  registrationFee: {
    type: Number,
    required: [true, 'Registration fee is required'],
    min: [0, 'Registration fee cannot be negative'],
    default: 0
  },
  eventStartDate: {
    type: Date,
    required: [true, 'Event start date is required']
  },
  eventEndDate: {
    type: Date,
    required: [true, 'Event end date is required']
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: [true, 'Organizer ID is required']
  },
  eventTags: [{
    type: String,
    trim: true
  }],
  eligibility: {
    type: String,
    enum: ['everyone', 'iiit-only', 'non-iiit-only'],
    default: 'everyone'
  },
  registrationLimit: {
    type: Number,
    min: [1, 'Registration limit must be at least 1'],
    default: null
  },
  currentRegistrations: {
    type: Number,
    default: 0
  },
  customForm: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
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
    purchaseLimitPerUser: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'closed', 'completed'],
    default: 'draft'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);