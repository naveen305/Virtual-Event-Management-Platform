const express = require('express');
const Event = require('../models/Event');
const { authenticate, authorize } = require('../middleware/auth');
const { sendRegistrationEmail } = require('../utils/emailService');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - title
 *         - date
 *       properties:
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         date:
 *           type: string
 *           format: date
 *         time:
 *           type: string
 *         location:
 *           type: string
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created
 *       403:
 *         description: Forbidden (Organizer only)
 */
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

/**
 * @swagger
 * /events:
 *   get:
 *     summary: List all events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name email');
        res.status(200).json(events);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get a single event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 */
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

// Register attendee for an event
/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registered successfully
 *       400:
 *         description: Event past or other validation error
 *       403:
 *         description: Forbidden (Organizer cannot register for own event)
 *       409:
 *         description: Already registered
 */
router.post('/:id/register', authenticate, authorize('attendee'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check for past event
        if (new Date(event.date) < new Date()) {
            return res.status(400).json({ error: 'Event has already passed' });
        }

        // Cannot register for own event
        if (event.organizer.toString() === req.user.id) {
            return res.status(403).json({ error: 'Organizers cannot register for their own event' });
        }

        // Check if already registered
        if (event.participants.includes(req.user.id)) {
            return res.status(409).json({ error: 'You are already registered for this event' });
        }

        // Add participant
        await Event.findByIdAndUpdate(req.params.id, {
            $addToSet: { participants: req.user.id }
        });

        // Send email notification asynchronously
        await sendRegistrationEmail(req.user.email, event.title);

        res.status(200).json({ message: 'Successfully registered for the event' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /events/{id}/unregister:
 *   delete:
 *     summary: Unregister from an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Unregistered successfully
 */
router.delete('/:id/unregister', authenticate, authorize('attendee'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if actually registered
        if (!event.participants.includes(req.user.id)) {
            return res.status(400).json({ error: 'You are not registered for this event' });
        }

        // Remove participant
        await Event.findByIdAndUpdate(req.params.id, {
            $pull: { participants: req.user.id }
        });

        res.status(200).json({ message: 'Successfully unregistered from the event' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get participants - organizer-only
/**
 * @swagger
 * /events/{id}/participants:
 *   get:
 *     summary: List event participants
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of participants
 *       403:
 *         description: Forbidden (Organizer only)
 */
router.get('/:id/participants', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('participants', 'name email');

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied, only the organizer can view the participant list' });
        }

        res.status(200).json(event.participants);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated
 *       403:
 *         description: Forbidden (Owner only)
 */
router.put('/:id', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied, modification only allowed by the creator' });
        }

        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedEvent);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 *       403:
 *         description: Forbidden (Owner only)
 */
router.delete('/:id', authenticate, authorize('organizer'), async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Verify ownership
        if (event.organizer.toString() !== req.user.id) {
            return res.status(403).json({ error: 'Access denied, deletion only allowed by the creator' });
        }

        await Event.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
