const request = require('supertest');

// Register a user and return the JWT token
const registerUser = async (app, role) => {
    const res = await request(app)
        .post('/auth/register')
        .send({ 
            name: `${role} User`, 
            email: `${role}${Date.now()}@test.com`, 
            password: 'password123', 
            role 
        });
    return res.body.token;
};

// Create a new event and return the event object
const createEvent = async (app, token) => {
    const res = await request(app)
        .post('/events')
        .set('Authorization', `Bearer ${token}`)
        .send({ 
            title: 'Test Event ' + Date.now(), 
            date: '2026-12-01', 
            time: '10:00', 
            location: 'HYD' 
        });
    return res.body;
};

module.exports = {
    registerUser,
    createEvent
};
