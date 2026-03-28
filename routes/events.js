const express = require('express');
const Event = require('../models/Event');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Create event: organizer-only
router.post('/', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const { title, description, date, time, location } = req.body;
        const event = new Event({
            title,
            description,
            date,
            time,
            location,
            organizer: req.user.id,
        });
        await event.save();
        res.status(201).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// List all events: any authenticated user
router.get('/', authenticate, async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name email');
        res.status(200).json(events);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get single event: populate organizer and participants
router.get('/:id', authenticate, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organizer', 'name email')
            .populate('participants', 'name email');
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update event: only the organizer who created it
router.put('/:id', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied, modification only allowed by the organizer' });
        }

        const { title, description, date, time, location } = req.body;
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            { title, description, date, time, location },
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedEvent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete event: only the organizer who created it
router.delete('/:id', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied, deletion only allowed by the organizer' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
