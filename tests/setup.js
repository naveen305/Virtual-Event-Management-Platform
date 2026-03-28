const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const dotenv = require('dotenv');

// Load env vars, but set a dummy JWT_SECRET for testing if undefined
dotenv.config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_for_jwt';
process.env.NODE_ENV = 'test';

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    // Verify if already connected (sometimes happens in hot reload or multiple test files depending on setup)
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri);
    }
});

beforeEach(async () => {
    if (mongoose.connection.readyState !== 0) {
        const collections = mongoose.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
});

afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
});
