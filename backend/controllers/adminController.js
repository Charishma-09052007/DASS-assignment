const User = require('../models/User');
const crypto = require('crypto');

exports.createOrganizer = async (req, res) => {
    try {
        const { organizerName, description, category, contactEmail, contactNumber } = req.body;
        
        const email = `${organizerName.toLowerCase().replace(/\s+/g, '.')}@felicity.iiit.ac.in`;
        const password = crypto.randomBytes(8).toString('hex');
        
        const organizer = await User.create({
            firstName: organizerName.split(' ')[0],
            lastName: organizerName.split(' ').slice(1).join(' ') || 'Club',
            email,
            password,
            contactNumber: contactNumber || '0000000000',
            collegeName: 'IIIT Hyderabad',
            role: 'organizer',
            participantType: null,
            organizerDetails: {
                organizerName,
                description,
                category,
                contactEmail: contactEmail || email
            }
        });
        
        organizer.password = undefined;
        
        res.status(201).json({
            success: true,
            message: 'Organizer account created successfully',
            data: {
                organizer,
                credentials: { email, password }
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllOrganizers = async (req, res) => {
    try {
        const organizers = await User.find({ 
            role: 'organizer',
            isActive: true 
        }).select('-password');
        
        res.status(200).json({
            success: true,
            count: organizers.length,
            data: organizers
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.removeOrganizer = async (req, res) => {
    try {
        const organizer = await User.findById(req.params.id);
        
        if (!organizer || organizer.role !== 'organizer') {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }
        
        organizer.isActive = false;
        await organizer.save();
        
        res.status(200).json({
            success: true,
            message: 'Organizer account disabled successfully'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};