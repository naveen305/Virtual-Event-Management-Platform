const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Load environment variables from .env file
dotenv.config();

const app = express();
app.use(express.json());

// Swagger definition
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Management API',
            version: '1.0.0',
            description: 'API for managing users, events, and registrations',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./routes/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
        if (process.env.NODE_ENV !== 'test') {
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
        }
    } catch (error) {
        console.error('Failed to start the server:', error.message);
        process.exit(1);
    }
};

// Execute the startup function
startServer();

module.exports = app;
