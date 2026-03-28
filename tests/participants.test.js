const request = require('supertest');
const app = require('../server');
const { registerUser } = require('./helpers');
const Event = require('../models/Event');

describe('Participant Endpoints', () => {
    let orgToken;
    let attToken;
    let otherAttToken;
    let eventId;

    beforeEach(async () => {
        orgToken = await registerUser(app, 'organizer');
        attToken = await registerUser(app, 'attendee');
        otherAttToken = await registerUser(app, 'attendee');

        const res = await request(app)
            .post('/events')
            .set('Authorization', `Bearer ${orgToken}`)
            .send({
                title: 'Participant Test Event',
                date: '2026-12-31',
            });
        eventId = res.body._id;
    });

    describe('POST /events/:id/register', () => {
        it('should register an attendee successfully (200)', async () => {
            const res = await request(app)
                .post(`/events/${eventId}/register`)
                .set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(200);

            const event = await Event.findById(eventId);
            expect(event.participants.length).toEqual(1);
        });

        it('should return 409 if attendee registers twice', async () => {
            await request(app).post(`/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`);
            const res = await request(app)
                .post(`/events/${eventId}/register`)
                .set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(409);
        });

        it('should return 400 if registering for a past event', async () => {
            // Update event directly in DB to push date to past
            await Event.findByIdAndUpdate(eventId, { date: '2000-01-01' });

            const res = await request(app)
                .post(`/events/${eventId}/register`)
                .set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(400);
        });

        it('should return 403 if an organizer tries to register', async () => {
            const res = await request(app)
                .post(`/events/${eventId}/register`)
                .set('Authorization', `Bearer ${orgToken}`);
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('DELETE /events/:id/unregister', () => {
        beforeEach(async () => {
            await request(app).post(`/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`);
        });

        it('should unregister an attendee successfully (200)', async () => {
            const res = await request(app)
                .delete(`/events/${eventId}/unregister`)
                .set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(200);

            const event = await Event.findById(eventId);
            expect(event.participants.length).toEqual(0);
        });

        it('should return 400 if attendee is not registered', async () => {
            const res = await request(app)
                .delete(`/events/${eventId}/unregister`)
                .set('Authorization', `Bearer ${otherAttToken}`);
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /events/:id/participants', () => {
        beforeEach(async () => {
            await request(app).post(`/events/${eventId}/register`).set('Authorization', `Bearer ${attToken}`);
            await request(app).post(`/events/${eventId}/register`).set('Authorization', `Bearer ${otherAttToken}`);
        });

        it('should return participants list for owner organizer (200)', async () => {
            const res = await request(app)
                .get(`/events/${eventId}/participants`)
                .set('Authorization', `Bearer ${orgToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toEqual(2);
            expect(res.body[0]).toHaveProperty('email');
        });

        it('should return 403 if an attendee tries to view participants', async () => {
            const res = await request(app)
                .get(`/events/${eventId}/participants`)
                .set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(403);
        });
    });
});
