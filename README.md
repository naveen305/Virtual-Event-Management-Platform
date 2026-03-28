# Event Management API

A RESTful API for managing events, built with Node.js, Express, and MongoDB. Supports user authentication, role-based access control, event CRUD, and attendee registration.

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT + bcrypt

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB running locally or a MongoDB Atlas URI

### Installation

```bash
git clone https://github.com/your-username/event-management-api.git
cd event-management-api
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/event-management
JWT_SECRET=your_jwt_secret_here
```

### Run

```bash
# Development
npm run dev

# Production
npm start
```

---

## Project Structure

```
├── models/
│   ├── User.js          # User schema (bcrypt pre-save hook)
│   └── Event.js         # Event schema with participants ref
├── middleware/
│   └── auth.js          # authenticate + authorize middlewares
├── routes/
│   ├── auth.js          # /auth endpoints
│   └── events.js        # /events endpoints
├── .env
└── server.js
```

---

## API Reference

### Auth

| Method | Endpoint         | Access | Description                        |
|--------|------------------|--------|------------------------------------|
| POST   | `/auth/register` | Public | Register a new user                |
| POST   | `/auth/login`    | Public | Login and receive a JWT            |
| GET    | `/auth/me`       | Auth   | Get current user profile           |

**Register body:**
```json
{
  "name": "Naveen",
  "email": "naveen@example.com",
  "password": "secret123",
  "role": "organizer"
}
```
> `role` must be `organizer` or `attendee`

**Login body:**
```json
{
  "email": "naveen@example.com",
  "password": "secret123"
}
```

**Response (both):**
```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

---

### Events

All event routes require `Authorization: Bearer <token>` header.

| Method | Endpoint                      | Access              | Description                      |
|--------|-------------------------------|---------------------|----------------------------------|
| POST   | `/events`                     | Organizer           | Create a new event               |
| GET    | `/events`                     | Authenticated       | List all events                  |
| GET    | `/events/:id`                 | Authenticated       | Get event details                |
| PUT    | `/events/:id`                 | Organizer (owner)   | Update event                     |
| DELETE | `/events/:id`                 | Organizer (owner)   | Delete event                     |
| POST   | `/events/:id/register`        | Attendee            | Register for an event            |
| DELETE | `/events/:id/unregister`      | Attendee            | Unregister from an event         |
| GET    | `/events/:id/participants`    | Organizer           | List event participants          |

**Create / Update event body:**
```json
{
  "title": "Tech Meetup",
  "description": "Monthly developer meetup",
  "date": "2025-06-15",
  "time": "14:00",
  "location": "Hyderabad"
}
```

---

## Roles & Permissions

| Action                        | Organizer | Attendee |
|-------------------------------|-----------|----------|
| Create / Edit / Delete event  | ✅ (own)  | ❌       |
| View events                   | ✅        | ✅       |
| Register for event            | ❌        | ✅       |
| View participant list         | ✅        | ❌       |

---

## Error Responses

All errors follow this shape:

```json
{ "error": "Descriptive error message" }
```

| Status | Meaning                        |
|--------|--------------------------------|
| 400    | Validation or bad request      |
| 401    | Missing or invalid token       |
| 403    | Forbidden (wrong role/owner)   |
| 404    | Resource not found             |
| 409    | Conflict (duplicate email/registration) |

---

## License

MIT