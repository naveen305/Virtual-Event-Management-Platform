const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create an Express application
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Define a simple route
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Auth Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

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
        process.exit(1); // Exit process with failure
    }
};

// Execute the startup function
startServer();
