const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.send('Event Management API is running...');
});

// Server and Database initialization
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

const startServer = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error('MONGO_URI is not defined in the environment variables.');
        }

        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('Successfully connected to MongoDB.');

        // Start the Express server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start the server:', error.message);
        process.exit(1);
    }
};

// Execute the startup function
startServer();
