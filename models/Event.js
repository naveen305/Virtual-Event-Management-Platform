const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  description:  { type: String },
  date:         { type: Date, required: true },
  time:         { type: String },        // e.g. "14:30"
  location:     { type: String },
  organizer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt:    { type: Date, default: Date.now }
});

const Event = mongoose.model('Event', eventSchema);
module.exports = Event;
