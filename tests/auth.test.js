const request = require('supertest');
const app = require('../server');
const { registerUser } = require('./helpers');

describe('Auth Endpoints', () => {
    describe('POST /auth/register', () => {
        it('should register a new user and return a token (201)', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Test Org',
                    email: 'org@test.com',
                    password: 'password123',
                    role: 'organizer'
                });
            expect(res.statusCode).toEqual(201);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 409 for duplicate email', async () => {
            await registerUser(app, 'organizer');
            const res = await request(app)
                .post('/auth/register')
                .send({
                    name: 'Duplicate',
                    email: 'organizer@test.com', // Helper creates something like organizer[timestamp]@test.com, let's do explicit here
                    password: 'password123',
                    role: 'organizer'
                });
            
            // Do exact duplicate
            await request(app).post('/auth/register').send({
                name: 'Exact Duplicate',
                email: 'duplicate@test.com',
                password: 'password123',
                role: 'organizer'
            });

            const resDuplicate = await request(app).post('/auth/register').send({
                name: 'Exact Duplicate',
                email: 'duplicate@test.com',
                password: 'password123',
                role: 'organizer'
            });

            expect(resDuplicate.statusCode).toEqual(409);
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(app)
                .post('/auth/register')
                .send({ email: 'missing@test.com' }); // missing password and name
            expect(res.statusCode).toEqual(400);
        });
    });

    describe('POST /auth/login', () => {
        beforeEach(async () => {
            await request(app).post('/auth/register').send({
                name: 'Login Test',
                email: 'login@test.com',
                password: 'password123',
                role: 'attendee'
            });
        });

        it('should login with valid credentials (200)', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should return 401 for wrong password', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'login@test.com',
                    password: 'wrongpassword'
                });
            expect(res.statusCode).toEqual(401);
        });

        it('should return 401 for unknown email', async () => {
            const res = await request(app)
                .post('/auth/login')
                .send({
                    email: 'unknown@test.com',
                    password: 'password123'
                });
            expect(res.statusCode).toEqual(401);
        });
    });

    describe('GET /auth/me', () => {
        let token;
        beforeEach(async () => {
            const res = await request(app).post('/auth/register').send({
                name: 'Me Test',
                email: 'me@test.com',
                password: 'password123',
                role: 'attendee'
            });
            token = res.body.token;
        });

        it('should return profile with valid token (200)', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer ${token}`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.email).toEqual('me@test.com');
            expect(res.body).not.toHaveProperty('password');
        });

        it('should return 401 without token', async () => {
            const res = await request(app).get('/auth/me');
            expect(res.statusCode).toEqual(401);
        });

        it('should return 401 with invalid/expired token', async () => {
            const res = await request(app)
                .get('/auth/me')
                .set('Authorization', `Bearer invalidtoken`);
            expect(res.statusCode).toEqual(401);
        });
    });
});
