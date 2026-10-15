# TaskFlow API

A task management REST API built with Node.js, Express, and MongoDB. TaskFlow supports user authentication, task CRUD operations, task ownership, input validation, and profile avatar uploads.

## Features

- User registration and login
- Password hashing with bcrypt
- JWT access and refresh tokens
- Cookie-based authentication
- Protected routes and logout
- Create, read, update, and delete tasks
- Task ownership: users can access only their own tasks
- Task input validation and centralized error handling
- Profile avatar uploads using Multer and Cloudinary
- MongoDB integration with Mongoose

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- bcrypt
- JSON Web Tokens (JWT)
- Multer
- Cloudinary

## Getting Started

### Prerequisites

- Node.js and npm
- A MongoDB database
- A Cloudinary account for avatar uploads

### Installation

Clone the repository and enter the project directory:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd task-flow
npm install
```

Create an `env` file in the project root using `.env.example` as a template. Fill in the required values locally. Never commit real credentials.

### Run the server

Development:

```bash
npm run dev
```

Production-style start:

```bash
npm start
```

The default development port is `7000`, unless configured otherwise.

## API Endpoints

Base URL: `http://localhost:7000/api/v1`

### Health

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Check API status |

### Users

| Method | Endpoint | Description |
|---|---|---|
| POST | `/users/register` | Register a user |
| POST | `/users/login` | Log in |
| POST | `/users/logout` | Log out |
| GET | `/users/current-user` | Get the authenticated user |
| PATCH | `/users/avatar` | Upload a profile avatar |

### Tasks

| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create a task |
| GET | `/tasks` | Get the authenticated user's tasks |
| GET | `/tasks/:id` | Get a task by ID |
| PATCH | `/tasks/:id` | Update a task |
| DELETE | `/tasks/:id` | Delete a task |

Protected endpoints require authentication. With cookie-based authentication, log in first and ensure your HTTP client sends the authentication cookies.

## Task Example

```json
{
  "title": "Revise backend concepts",
  "description": "Practice building APIs",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-10-20"
}
```

Supported priorities: `low`, `medium`, `high`.

Supported statuses: `pending`, `in_progress`, `completed`.

## Testing

Use Postman to test authentication, task CRUD operations, invalid inputs, task ownership, and avatar uploads.

## Security

- Keep environment variables and credentials out of version control.
- Use strong, private JWT secrets.
- Configure CORS for trusted frontend origins when using credentialed requests.
- Use HTTPS in production.

## License

Add a license before distributing this project publicly.
