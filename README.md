# Dexio AI

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
![Phase](https://img.shields.io/badge/backend-phase%204%20complete-blue?style=for-the-badge)

A full-stack, AI-powered chat application backend built with Node.js and Express. Dexio AI provides multi-turn conversational chat backed by the **Sarvam AI** language model, long-term **vector memory** via MongoDB Atlas Vector Search, and a complete authentication system supporting both email/password and Google OAuth 2.0.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [AI Message Pipeline](#ai-message-pipeline)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Running Tests](#running-tests)
- [Project Status](#project-status)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

### Backend

| Technology | Version |
|---|---|
| Node.js | ESM (`"type": "module"`) |
| Express | ^5.2.1 |
| MongoDB | Atlas (with Vector Search index) |
| Mongoose | ^9.5.0 |
| Sarvam AI SDK (`sarvamai`) | ^1.1.7 |
| Google Generative AI (`@google/genai`) | ^2.3.0 |
| Passport.js + Google OAuth 2.0 | ^0.7.0 / ^2.0.0 |
| JSON Web Token (`jsonwebtoken`) | ^9.0.3 |
| bcryptjs | ^3.0.3 |
| Nodemailer | ^8.0.7 |
| Zod | ^4.3.6 |
| Winston | ^3.19.0 |
| Helmet | ^8.1.0 |
| express-rate-limit | ^8.5.1 |
| Morgan | ^1.10.1 |
| cookie-parser | ^1.4.7 |
| dotenv | ^17.4.2 |

### Testing

| Technology | Version |
|---|---|
| Jest | ^30.3.0 |
| Supertest | ^7.2.2 |
| mongodb-memory-server | ^11.1.0 |
| Babel (`@babel/preset-env`) | ^7.29.5 |
| cross-env | ^10.1.0 |

---

## Features

### Authentication
- **Email/password registration** with Zod schema validation and bcrypt hashing
- **Email verification** via tokenised link (24-hour expiry) sent through Nodemailer/Gmail SMTP
- **JWT authentication** stored in an `httpOnly` cookie (7-day expiry for standard login, 1-day for OAuth)
- **Google OAuth 2.0** login and registration via Passport.js (`passport-google-oauth20`)
- **Forgot password** flow generating a secure `crypto.randomBytes` reset token (10-minute expiry)
- **Password reset** via tokenised query parameter
- **Role-based access control** middleware (`requireRole`) with `user`, `ai`, and `system` roles

### AI Chat
- **Multi-turn conversation** powered by the `sarvam-m` model via the Sarvam AI SDK
- **Automatic chat title generation** on the first message of every new conversation
- **Hinglish-aware system prompt** — responds in Hinglish when the user writes in Hindi/mixed script, pure English otherwise
- **Think-tag stripping** — `<think>...</think>` blocks in model output are removed before the response is returned to the client

### Vector Memory
- **Message embeddings** generated using Google's `gemini-embedding-2` model (768 dimensions) on every user message
- **Semantic search** at query time using MongoDB Atlas `$vectorSearch` with a minimum similarity score threshold of `0.75` and a candidate pool of 100, returning the top 5 relevant past messages
- **Per-chat scoping** — vector search is filtered by `chatId`, ensuring memory is isolated to the current conversation
- **Context injection** — retrieved long-term memory is serialised and injected into the system prompt alongside the last 4 recent messages (short-term memory) before each AI call

### Chat & Message Management
- Full **CRUD** for chat sessions (create, read, update name, delete)
- Full **CRUD** for messages within a chat
- Cascading delete — removing a chat also deletes all associated messages
- Chat ownership enforced — all chat/message operations verify the requesting user owns the resource

### Security & Reliability
- **Helmet** sets security-relevant HTTP headers on every response
- **Rate limiting** on all auth routes: 10 requests per minute per IP (bypassed in `testing` environment)
- **Centralised error handler** with stack traces in `development`, clean messages in `production`
- **Uncaught exception / unhandled rejection** handlers at the process level — log and exit with code 1
- **Winston** structured logging to `logs/error.log` and `logs/combined.log`, with console output outside of production; HTTP-level logging via Morgan using the `combined` format

---

## AI Message Pipeline

When a user sends a message via `POST /v1/message/create`, the following sequence runs synchronously before a response is returned:

1. **Ownership check** — verifies the chat exists and belongs to the authenticated user
2. **User message saved** — the message is persisted to MongoDB with `role: "user"`
3. **Embedding generated** — the message text is sent to Google's `gemini-embedding-2` model, returning a 768-dimension vector which is saved back to the message document
4. **Vector memory searched** — the embedding is used to query MongoDB Atlas Vector Search, retrieving up to 5 semantically similar past messages from the same chat (long-term memory), filtered to a minimum similarity score of `0.75`
5. **Context assembled** — the last 4 messages from the chat (short-term memory) are fetched and combined with the vector search results into a structured prompt
6. **Auto-title** — if this is the first message in the chat, a separate AI call generates a 3–5 word title and updates the chat document
7. **AI response generated** — the full prompt is sent to Sarvam AI's `sarvam-m` model; `<think>` tags are stripped from the output before the response is used
8. **AI message saved** — the cleaned response is persisted to MongoDB with `role: "ai"`
9. **Response returned** — the AI response is returned to the client in the standard `{ success, data, error }` envelope

---

## Architecture Overview

The backend follows a layered MVC-style architecture. All application logic lives under `src/`, with configuration isolated in `config/`.

```
Request → Route → Middleware(s) → Controller → Service(s) → Model → DB
```

**Config layer** (`config/`) loads environment variables via `dotenv` and configures the Passport Google strategy. All environment values are exported from a single `index.js` so no file reaches into `process.env` directly.

**Route layer** (`src/routes/`) declares endpoints and chains the appropriate middleware before handing off to controllers. Auth routes additionally apply the Zod validation middleware and the rate limiter (in non-test environments).

**Middleware layer** (`src/middlewares/`) contains four concerns: JWT authentication (`authSystem`), role enforcement (`requireRole`), Zod request validation (`validateRequest`), rate limiting, and the global error handler.

**Controller layer** (`src/controllers/`) contains all request/response logic. Controllers delegate business work (AI calls, embedding generation) to services and only handle HTTP concerns.

**Service layer** (`src/services/`) encapsulates all external integrations:
- `ai.service.js` — orchestrates embedding lookup, short-term message history retrieval, and the Sarvam AI completion call.
- `vector.service.js` — generates embeddings via Google Gemini and runs `$vectorSearch` aggregation pipelines against MongoDB Atlas.
- `email.service.js` — wraps Nodemailer for transactional email delivery.

**Model layer** (`src/models/`) defines three Mongoose schemas: `user`, `chat`, and `message`. The `message` schema includes an optional `embedding` field (array of numbers) for vector storage.

---

## Project Structure

```
├── config/
│   ├── index.js                  # Loads and exports all env vars
│   └── google.strategy.js        # Passport Google OAuth strategy
├── src/
│   ├── app.js                    # Express app setup and route mounting
│   ├── db/
│   │   └── db.js                 # Mongoose connection
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── chat.controller.js
│   │   └── message.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimiter.middleware.js
│   │   └── validation.middleware.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── chat.model.js
│   │   └── message.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── chat.route.js
│   │   └── message.route.js
│   ├── schemas/
│   │   └── auth.schema.js        # Zod validation schemas
│   ├── services/
│   │   ├── ai.service.js
│   │   ├── email.service.js
│   │   └── vector.service.js
│   ├── tests/
│   │   ├── testMongodb.js        # In-memory MongoDB test helpers
│   │   ├── auth.test.js
│   │   ├── chat.test.js
│   │   └── message.test.js
│   └── utils/
│       └── logger.js             # Winston logger
├── logs/                         # Auto-created at runtime
├── babel.config.js               # Babel config for Jest + ESM
├── package.json
├── .gitignore
├── .env                          # Not committed — see Environment Variables
└── server.js                     # Entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **MongoDB Atlas** cluster with a Vector Search index configured (see below)
- A **Gmail** account with an App Password for Nodemailer
- A **Google Cloud** OAuth 2.0 client ID and secret
- A **Sarvam AI** API subscription key
- A **Google AI** (Gemini) API key

### MongoDB Atlas Vector Search Index

Before running the application, create a Vector Search index on your `messages` collection in MongoDB Atlas. Navigate to **Atlas Search → Create Search Index → JSON Editor** and use the following configuration:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "chatId"
    }
  ]
}
```

Set the index name to `vector_index`. The `chatId` filter field is required — it enables per-conversation memory scoping during vector search.

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NovaWhisperer/dexio-ai-2.git
cd dexio-ai-2

# 2. Install dependencies
npm install

# 3. Create your environment file
touch .env
# Fill in all required values — see the Environment Variables section below

# 4. Start the development server
npm run dev
```

The server will start on the port defined in your `.env` file. Verify it is running:

```
GET http://localhost:<PORT>/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "...",
  "uptime": 0.0
}
```

### Available Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Starts the server with nodemon — restarts automatically on file changes |
| Test | `npm test` | Runs the full Jest suite with `NODE_ENV=testing` |

---

## Environment Variables

Create a `.env` file in the project root. All variables listed below are required.

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | MongoDB Atlas connection string (must point to a cluster with a configured vector search index) |
| `NODE_ENV` | Runtime environment — `development`, `production`, or `testing` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens |
| `EMAIL_USER` | Gmail address used as the SMTP sender |
| `EMAIL_PASS` | Gmail App Password for the SMTP sender account |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret from Google Cloud Console |
| `GEMINI_API_KEY` | Google AI API key used for generating message embeddings (`gemini-embedding-2`) |
| `SARVAM_API_KEY` | Sarvam AI API subscription key used for chat completions and title generation |

### .env Reference

```env
PORT=
MONGO_URI=
NODE_ENV=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GEMINI_API_KEY=
SARVAM_API_KEY=
```

> **Note:** The Google OAuth callback URL is currently hardcoded to `http://localhost:3000/v1/auth/google/callback`. Ensure this matches the authorised redirect URI configured in your Google Cloud Console OAuth client.

---

## API Routes

All routes are prefixed with `/v1`. A `✓` in the **Auth** column means the request must include a valid JWT in the `token` cookie.

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Returns server status, uptime, and timestamp |

### Authentication — `/v1/auth`

> Auth routes are rate-limited to **10 requests per minute per IP** in non-testing environments.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/register` | — | Register a new user. Sends a verification email. Body: `{ fullName: { firstName, lastName }, email, password }`. Password must be at least 8 characters. |
| `GET` | `/v1/auth/verify-email` | — | Verify email address using the token sent at registration. Query: `?token=<token>` |
| `POST` | `/v1/auth/login` | — | Authenticate with email and password. Sets `token` cookie on success. Body: `{ email, password }` |
| `POST` | `/v1/auth/logout` | ✓ | Clear the authentication cookie |
| `POST` | `/v1/auth/forgot-password` | — | Request a password reset link via email. Body: `{ email }` |
| `POST` | `/v1/auth/reset-password` | — | Reset password using the reset token. Query: `?token=<token>`. Body: `{ password }` |
| `GET` | `/v1/auth/google` | — | Initiate Google OAuth 2.0 login flow |
| `GET` | `/v1/auth/google/callback` | — | OAuth 2.0 callback — handled by Passport, sets `token` cookie on success |

### Chats — `/v1/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/chat/create` | ✓ | Create a new chat session for the authenticated user |
| `GET` | `/v1/chat/read` | ✓ | Retrieve all chat sessions belonging to the authenticated user |
| `PATCH` | `/v1/chat/update/:id` | ✓ | Update the name of a chat session. Body: `{ chatName }` |
| `DELETE` | `/v1/chat/delete/:id` | ✓ | Delete a chat session and all of its messages (cascading) |

### Messages — `/v1/message`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/message/create` | ✓ | Send a user message. Generates an embedding, retrieves vector memory, calls the AI, auto-titles the chat on first message, and persists both the user message and AI response. Body: `{ chatId, messageContent }` |
| `GET` | `/v1/message/read/:chatId` | ✓ | Retrieve all messages for a given chat session |
| `PATCH` | `/v1/message/update/:id` | ✓ | Update the content of an existing message. Body: `{ chatId, messageContent }` |
| `DELETE` | `/v1/message/delete/:id` | ✓ | Delete a specific message. Body: `{ chatId }` |

### Response Envelope

All endpoints return a consistent JSON envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "Error message" | null
}
```

> **Note on error responses:** When an error is passed to `next(err)` — whether from a failed JWT verification in `authSystem`, a Zod validation error in `validateRequest`, or an unhandled throw in a controller — the global error handler returns a different shape from the standard envelope. In `development`: `{ errMessage, stack }`. In `production`: `{ errMessage }`. API consumers should handle both shapes.

---

## Running Tests

The test suite uses **Jest** and **Supertest**. An in-memory MongoDB instance (`mongodb-memory-server`) is spun up automatically — no live database connection is required. All external services (Sarvam AI, Google Gemini, Nodemailer) are mocked using `jest.mock()`, so the suite runs fully offline with zero API calls.

```bash
# Run all tests
npm test
```

Jest is configured to use Babel (`babel-jest`) for ESM transpilation. The `cross-env` package sets `NODE_ENV=testing`, which disables the rate limiter on auth routes during the test run.

### Test Coverage

| File | Scope |
|---|---|
| `auth.test.js` | Register, login, email verification, logout, forgot password, reset password — 20 tests |
| `chat.test.js` | Create, read, update, and delete chat sessions; authentication enforcement — 10 tests |
| `message.test.js` | Create, read, update, and delete messages; AI and vector services mocked — 12 tests |

---

## Project Status

### ✅ Phase 1 — Foundation (Complete)

- [x] Express application setup with Helmet, Morgan, and cookie-parser
- [x] MongoDB connection via Mongoose
- [x] Centralised environment configuration (`config/index.js`)
- [x] Winston structured logging (file + console, environment-aware log levels)
- [x] Global error handler with dev/prod response differences
- [x] Process-level uncaught exception and unhandled rejection handlers
- [x] `GET /health` endpoint returning status, uptime, and timestamp

### ✅ Phase 2 — Authentication (Complete)

- [x] User model with indexed fields (`email`, `googleID`, `verificationToken`, `resetToken`)
- [x] Zod validation schemas and `validateRequest` middleware
- [x] Register with email verification (24-hour token, rollback on email failure)
- [x] Login with JWT cookie (7-day expiry, `httpOnly`, `sameSite: lax`)
- [x] Logout with cookie clear
- [x] Forgot password and reset password flows (10-minute token, no email enumeration)
- [x] Google OAuth 2.0 via Passport.js (find-or-create, auto-verified)
- [x] JWT auth middleware (`authSystem`) and role guard middleware (`requireRole`)
- [x] Rate limiting on all auth routes (10 req/min, bypassed in test env)
- [x] Integration test suite — 20 passing tests across all auth flows

### ✅ Phase 3 — Core Features (Complete)

- [x] Chat model with `userId` index and default name `"New Chat"`
- [x] Message model with `chatId` index and `role` enum (`user` / `ai`)
- [x] Full chat CRUD with ownership enforcement (all queries include `userId`)
- [x] Full message CRUD with ownership enforcement
- [x] Cascading delete — chat deletion removes all associated messages via `deleteMany`
- [x] Integration tests for all chat and message endpoints

### ✅ Phase 4 — AI Layer (Complete)

- [x] `embedding: [Number]` field added to Message model
- [x] `vector.service.js` — Gemini `gemini-embedding-2` embedding generation (768 dimensions)
- [x] MongoDB Atlas `$vectorSearch` with `chatId` filter, cosine similarity, score threshold `0.75`, top 5 results
- [x] `ai.service.js` — Sarvam AI `sarvam-m` completions combining long-term memory (vector search) and short-term memory (last 4 messages)
- [x] Auto-title generation triggered on first message of each chat session
- [x] `<think>` tag stripping from model output before returning to client
- [x] AI and vector services fully mocked in test suite — tests run offline

### 🔜 Phase 5 — Infrastructure (Planned)

- [ ] CSRF protection
- [ ] Redis-backed token blacklist for proper logout invalidation
- [ ] Background job queue (Bull/Redis) to offload embedding generation from the request cycle
- [ ] Expanded rate limiting beyond auth routes
- [ ] Swagger/OpenAPI documentation for all endpoints
- [ ] Sentry structured error tracking and alerting
- [ ] Usage analytics

### 🔜 Phase 6 — Frontend (Planned)

- [ ] React + Vite frontend application
- [ ] Authentication UI (register, login, Google OAuth)
- [ ] Chat interface with real-time message rendering
- [ ] Chat sidebar with session management

---

## Contributing

Issues and pull requests are welcome. For significant changes, please open an issue first to discuss what you would like to change. Ensure all tests pass before submitting a PR.

```bash
npm test
```

Commits follow the convention below:

| Type | When to use |
|---|---|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `chore` | Maintenance, config changes, no app logic |
| `refactor` | Restructuring without changing behaviour |
| `test` | Adding or updating tests |
| `docs` | README updates, comments, API specs |
| `ci` | Build pipelines, deployment config |

---

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.