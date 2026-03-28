const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { registerUser } = require('./helpers');

describe('Event Endpoints', () => {
    let orgToken;
    let attToken;
    let otherOrgToken;

    beforeEach(async () => {
        orgToken = await registerUser(app, 'organizer');
        attToken = await registerUser(app, 'attendee');
        otherOrgToken = await registerUser(app, 'organizer');
    });

    describe('POST /events', () => {
        it('should create an event if user is an organizer (201)', async () => {
            const res = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({
                    title: 'Organizer Event',
                    date: '2026-10-10',
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('title', 'Organizer Event');
            expect(res.body).toHaveProperty('organizer');
        });

        it('should return 403 if user is an attendee', async () => {
            const res = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${attToken}`)
                .send({
                    title: 'Attendee Event',
                    date: '2026-10-10',
                });
            expect(res.statusCode).toEqual(403);
        });

        it('should return 400 if missing required title or date', async () => {
            const res = await request(app)
                .post('/events')
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ location: 'Remote' }); // missing title and date
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('GET /events', () => {
        it('should list all events when authenticated (200)', async () => {
            await request(app).post('/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'Event 1', date: '2026-10-10' });
            await request(app).post('/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'Event 2', date: '2026-10-11' });

            const res = await request(app).get('/events').set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBeTruthy();
            expect(res.body.length).toBeGreaterThanOrEqual(2);
        });

        it('should return 401 if unauthenticated', async () => {
            const res = await request(app).get('/events');
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /events/:id', () => {
        let eventId;
        beforeEach(async () => {
            const res = await request(app).post('/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'Single Event', date: '2026-10-10' });
            eventId = res.body._id;
        });

        it('should get a single event with valid id (200)', async () => {
            const res = await request(app).get(`/events/${eventId}`).set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('_id', eventId);
            expect(res.body.organizer).toHaveProperty('name');
        });

        it('should return 404 for invalid/non-existent id', async () => {
            const fakeId = new mongoose.Types.ObjectId().toHexString();
            const res = await request(app).get(`/events/${fakeId}`).set('Authorization', `Bearer ${attToken}`);
            expect(res.statusCode).toEqual(404);
        });
    });

    describe('PUT /events/:id', () => {
        let eventId;
        beforeEach(async () => {
            const res = await request(app).post('/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'Put Event', date: '2026-10-10' });
            eventId = res.body._id;
        });

        it('should update event if requested by the owner organizer (200)', async () => {
            const res = await request(app)
                .put(`/events/${eventId}`)
                .set('Authorization', `Bearer ${orgToken}`)
                .send({ title: 'Updated Title' });
            expect(res.statusCode).toEqual(200);
            expect(res.body.title).toEqual('Updated Title');
        });

        it('should return 403 if requested by a different organizer', async () => {
            const res = await request(app)
                .put(`/events/${eventId}`)
                .set('Authorization', `Bearer ${otherOrgToken}`)
                .send({ title: 'Hacked Title' });
            expect(res.statusCode).toEqual(403);
        });
    });

    describe('DELETE /events/:id', () => {
        let eventId;
        beforeEach(async () => {
            const res = await request(app).post('/events').set('Authorization', `Bearer ${orgToken}`).send({ title: 'Delete Event', date: '2026-10-10' });
            eventId = res.body._id;
        });

        it('should delete event if requested by the owner organizer (200)', async () => {
            const res = await request(app)
                .delete(`/events/${eventId}`)
                .set('Authorization', `Bearer ${orgToken}`);
            expect(res.statusCode).toEqual(200);

            // Verify deletion
            const getRes = await request(app).get(`/events/${eventId}`).set('Authorization', `Bearer ${orgToken}`);
            expect(getRes.statusCode).toEqual(404);
        });

        it('should return 403 if requested by a non-owner organizer', async () => {
            const res = await request(app)
                .delete(`/events/${eventId}`)
                .set('Authorization', `Bearer ${otherOrgToken}`);
            expect(res.statusCode).toEqual(403);
        });
    });
});
