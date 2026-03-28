const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
    description: {
        type: String,
    },
    date: {
        type: Date,
        required: [true, 'Date is required'],
    },
    time: {
        type: String, // e.g. "14:30"
    },
    location: {
        type: String,
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Organizer is required'],
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
