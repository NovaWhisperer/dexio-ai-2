# Dexio AI

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=for-the-badge&logo=node.js&logoColor=white)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](./LICENSE)
![Status](https://img.shields.io/badge/status-active-success?style=for-the-badge)
![Phase](https://img.shields.io/badge/backend-phase%205%20complete-blue?style=for-the-badge)
![Tests](https://img.shields.io/badge/tests-50%20passing-brightgreen?style=for-the-badge)

> Production-grade Node.js backend for a multi-turn AI chat application — vector memory, full authentication, and a comprehensive integration test suite.

A full-stack, AI-powered chat application backend built with Node.js and Express. Dexio AI provides multi-turn conversational chat backed by the **Sarvam AI** language model, long-term **vector memory** via MongoDB Atlas Vector Search, a complete authentication system supporting both email/password and Google OAuth 2.0, a **Redis-backed token blacklist**, **CSRF protection**, **Sentry error tracking**, **OpenAPI/Swagger documentation**, and a **user analytics** layer.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [AI Message Pipeline](#ai-message-pipeline)
- [Architecture Overview](#architecture-overview)
- [Data Models](#data-models)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Running Tests](#running-tests)
- [Troubleshooting](#troubleshooting)
- [Before You Deploy](#before-you-deploy)
- [Known Issues](#known-issues)
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
| csrf-csrf | ^4.0.3 |
| redis | ^5.12.1 |
| @sentry/node | ^10.53.1 |
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

### Dev Tools & Documentation

| Technology | Version |
|---|---|
| nodemon | ^3.1.14 |
| swagger-jsdoc | ^6.2.8 |
| swagger-ui-express | ^5.0.1 |

---

## Features

### Authentication
- **Email/password registration** with Zod schema validation and bcrypt hashing
- **Email verification** via tokenised link (24-hour expiry) sent through Nodemailer/Gmail SMTP
- **JWT authentication** stored in an `httpOnly` cookie (7-day expiry for standard login, 1-day for OAuth)
- **Google OAuth 2.0** login and registration via Passport.js (`passport-google-oauth20`)
- **Forgot password** flow generating a secure `crypto.randomBytes` reset token (10-minute expiry)
- **Password reset** via tokenised query parameter
- **Role-based access control** middleware (`requireRole`) with `user`, `ai`, `system`, and `admin` roles
- **Redis token blacklist** — on logout, the JWT is stored in Redis with a TTL matching the token's remaining lifetime; `authSystem` rejects any blacklisted token on every subsequent request

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

### User Analytics
- **Analytics document created on registration** — a `userAnalytics` document is seeded for every new user alongside the user document
- **Chat count** incremented via `$inc` on every `POST /v1/chat/create`
- **Message count** incremented via `$inc` on every `POST /v1/message/create`
- **Last active timestamp** updated on every chat and message creation
- **Admin-only read endpoint** — `GET /v1/analytics/:userId` is protected by `authSystem` + `requireRole(["admin"])`

### Security & Reliability
- **Helmet** sets security-relevant HTTP headers on every response
- **CSRF protection** via the double-submit cookie pattern (`csrf-csrf`): a CSRF token is issued at `GET /v1/csrf-token`, sent by the client in the `x-csrf-token` header, and validated on all state-changing requests; bypassed in the `testing` environment
- **Rate limiting** on auth, chat, and message routes (auth: 10 req/min, chat: 5 req/min, message: 50 req/min); bypassed in the `testing` environment
- **Sentry error tracking** — `instrument.js` is imported first in `server.js`, before all other imports; `Sentry.setupExpressErrorHandler(app)` is registered in `app.js` before the 404 and global error handler
- **Centralised error handler** — all responses follow the `{ success, data, error }` envelope; stack trace added as a separate top-level field in `development` only
- **Uncaught exception / unhandled rejection** handlers at the process level — log and exit with code 1
- **Winston** structured logging to `logs/error.log` and `logs/combined.log`, with console output outside of production; HTTP-level logging via Morgan using the `combined` format; log level is `http` in development and `info` otherwise

### API Documentation
- **OpenAPI 3.0 / Swagger** — JSDoc annotations on every route file; `swagger-jsdoc` generates the spec from `config/openapi.js`; Swagger UI is served at `GET /api-docs` in the `development` environment only; all authenticated routes are annotated with the `cookieAuth` security scheme

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
9. **Analytics updated** — `messageCount` is incremented and `lastActiveAt` is updated on the user's analytics document
10. **Response returned** — the AI response is returned to the client in the standard `{ success, data, error }` envelope

---

## Architecture Overview

The backend follows a layered MVC-style architecture. All application logic lives under `src/`, with configuration isolated in `config/`.

```
Request → Route → Middleware(s) → Controller → Service(s) → Model → DB
```

**Entry point** (`server.js`) imports `instrument.js` first — before any other module — so Sentry is initialised before Express loads. It then connects to MongoDB and Redis, registers process-level exception handlers, and starts the HTTP server.

**Config layer** (`config/`) loads environment variables via `dotenv` and configures the Passport Google strategy and the OpenAPI spec. All environment values are exported from a single `index.js` so no file reaches into `process.env` directly.

**Route layer** (`src/routes/`) declares endpoints and chains the appropriate middleware before handing off to controllers. Auth, chat, and message routes apply their respective rate limiters (skipped in `testing`). Auth routes additionally apply the Zod validation middleware.

**Middleware layer** (`src/middlewares/`) handles six concerns: JWT authentication with Redis blacklist check (`authSystem`), role enforcement (`requireRole`), Zod request validation (`validateRequest`), CSRF protection (`doubleCsrfProtection`), rate limiting, and the global error handler.

**Controller layer** (`src/controllers/`) contains all request/response logic. Controllers delegate business work to services and only handle HTTP concerns. The auth, chat, and message controllers also write to the `userAnalytics` collection as side effects.

**Service layer** (`src/services/`) encapsulates all external integrations:
- `ai.service.js` — orchestrates embedding lookup, short-term message history retrieval, and the Sarvam AI completion call.
- `vector.service.js` — generates embeddings via Google Gemini and runs `$vectorSearch` aggregation pipelines against MongoDB Atlas.
- `email.service.js` — wraps Nodemailer for transactional email delivery.

**Model layer** (`src/models/`) defines four Mongoose schemas: `user`, `chat`, `message`, and `userAnalytics`. The `message` schema includes an optional `embedding` field (array of numbers) for vector storage. The `user` schema's `role` enum includes `"admin"` to support analytics access control.

**Database layer** (`src/db/`) manages two connections: `mongo.js` for Mongoose and `redis.js` for the Redis client used by the token blacklist.

---

## Data Models

### User (`user.model.js`)

Stores credentials, identity, verification state, and role for every registered account. Google OAuth users have no `password` field — authentication is handled entirely via `googleID`.

| Field | Type | Required | Default | Index |
|---|---|---|---|---|
| `fullName.firstName` | String | yes | — | — |
| `fullName.lastName` | String | yes | — | — |
| `email` | String | yes | — | ✅ unique |
| `password` | String | no | — | — |
| `googleID` | String | no | — | ✅ |
| `verified` | Boolean | no | `false` | — |
| `verificationToken` | String | no | — | ✅ |
| `verificationTokenExpiry` | Date | no | — | — |
| `resetToken` | String | no | — | ✅ |
| `resetTokenExpiry` | Date | no | — | — |
| `role` | String | yes | `"user"` | — |
| `createdAt` | Date | auto | — | — |
| `updatedAt` | Date | auto | — | — |

`role` enum: `"user"` (default for all registered accounts), `"admin"` (grants access to analytics endpoints via `requireRole(["admin"])`), `"ai"` and `"system"` (reserved for future use — currently unassigned by any controller)

---

### Chat (`chat.model.js`)

Represents a single conversation session. Always belongs to one user. Defaults to `"New Chat"` until the AI pipeline generates a title on the first message.

| Field | Type | Required | Default | Index |
|---|---|---|---|---|
| `userId` | ObjectId (ref: `user`) | yes | — | ✅ |
| `chatName` | String | yes | `"New Chat"` | — |
| `createdAt` | Date | auto | — | — |
| `updatedAt` | Date | auto | — | — |

---

### Message (`message.model.js`)

Stores individual messages within a chat. Both user messages and AI responses are stored here, distinguished by `role`. The `embedding` field is populated asynchronously after the message is saved and is used exclusively for vector search — it is never returned to the client directly.

| Field | Type | Required | Default | Index |
|---|---|---|---|---|
| `chatId` | ObjectId (ref: `chat`) | yes | — | ✅ |
| `messageContent` | String | yes | — | — |
| `role` | String | yes | `"user"` | — |
| `embedding` | [Number] | no | — | — |
| `createdAt` | Date | auto | — | — |
| `updatedAt` | Date | auto | — | — |

`role` enum: `"user"`, `"ai"`

---

### UserAnalytics (`userAnalytics.model.js`)

One document per user, created at registration. Tracks aggregate activity counts and last active timestamp. Updated as a side effect on chat and message creation — never through a dedicated analytics write endpoint.

| Field | Type | Required | Default | Index |
|---|---|---|---|---|
| `userId` | ObjectId (ref: `user`) | yes | — | ✅ |
| `chatCount` | Number | yes | `0` | — |
| `messageCount` | Number | yes | `0` | — |
| `lastActiveAt` | Date | yes | `Date.now` | — |
| `createdAt` | Date | auto | — | — |
| `updatedAt` | Date | auto | — | — |

---

### Indexes at a glance

| Model | Indexed fields |
|---|---|
| `user` | `email` (unique), `googleID`, `verificationToken`, `resetToken` |
| `chat` | `userId` |
| `message` | `chatId` |
| `userAnalytics` | `userId` |

All queried fields are indexed. The `verificationToken` and `resetToken` indexes on the `user` model exist because those fields are used as lookup keys during email verification and password reset — not as query filters on lists.

---

## Project Structure

```
├── config/
│   ├── index.js               # Loads and exports all env vars
│   ├── google.strategy.js     # Passport Google OAuth strategy
│   └── openapi.js             # swaggerJsdoc config — OpenAPI 3.0 spec with cookieAuth security scheme
├── instrument.js              # Sentry init — imported first in server.js before all other imports
├── src/
│   ├── app.js                 # Express app setup, middleware stack, route mounting, Sentry error handler
│   ├── db/
│   │   ├── mongo.js           # Mongoose connection
│   │   └── redis.js           # Redis client setup and connectRedis()
│   ├── controllers/
│   │   ├── auth.controller.js     # All auth controllers
│   │   ├── chat.controller.js     # All chat controllers
│   │   ├── message.controller.js  # All message controllers — includes full AI pipeline
│   │   └── analytics.controller.js # userAnalyticsController — admin only
│   ├── middlewares/
│   │   ├── auth.middleware.js         # authSystem (JWT verify + Redis blacklist check) and requireRole
│   │   ├── csrf.middleware.js         # doubleCsrf config — exports doubleCsrfProtection and generateCsrfToken
│   │   ├── errorHandler.middleware.js # 4-param error handler — { success, data, error } envelope always
│   │   ├── rateLimiter.middleware.js  # authLimiter (10/min), chatLimiter (5/min), messageLimiter (50/min)
│   │   └── validation.middleware.js  # validateRequest(schema) — Zod safeParse, attaches req.data
│   ├── models/
│   │   ├── user.model.js          # User schema — role enum includes "admin"
│   │   ├── chat.model.js          # Chat schema with index on userId
│   │   ├── message.model.js       # Message schema with index on chatId — includes embedding: [Number]
│   │   └── userAnalytics.model.js # UserAnalytics schema — chatCount, messageCount, lastActiveAt
│   ├── routes/
│   │   ├── auth.route.js      # Auth routes with OpenAPI JSDoc annotations
│   │   ├── chat.route.js      # Chat routes with OpenAPI JSDoc annotations
│   │   ├── message.route.js   # Message routes with OpenAPI JSDoc annotations
│   │   └── analytics.route.js # Analytics routes with OpenAPI JSDoc annotations
│   ├── schemas/
│   │   └── auth.schema.js     # Zod schemas: registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema
│   ├── services/
│   │   ├── ai.service.js      # generateResponse and generateChatTitle using Sarvam AI
│   │   ├── email.service.js   # Nodemailer transporter + sendMailer
│   │   └── vector.service.js  # createEmbedding (Gemini) and searchKnowledgeBase (Atlas Vector Search)
│   ├── tests/
│   │   ├── testMongodb.js     # mongodb-memory-server helpers: connect(), clear(), disconnect()
│   │   ├── auth.test.js       # 22 tests across all auth flows
│   │   ├── chat.test.js       # 11 tests for all chat CRUD endpoints
│   │   ├── message.test.js    # 13 tests for all message CRUD endpoints
│   │   └── analytics.test.js  # 4 tests for the analytics route
│   └── utils/
│       └── logger.js          # Winston logger with Morgan stream
├── logs/                      # Auto-created at runtime
├── babel.config.js            # Babel config for Jest + ESM
├── package.json               # type: module, test: cross-env NODE_ENV=testing jest
├── .gitignore
├── .env                       # Not committed — see Environment Variables
└── server.js                  # Entry point — imports instrument.js first

frontend/                      # Not started — React + Vite (Phase 6)
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or later
- **MongoDB Atlas** cluster with a Vector Search index configured (see below)
- **Redis** instance (local or cloud — host, port, and password required; the client connects with `username: "default"`, which is correct for most managed Redis providers including Redis Cloud; if your instance uses a different username, update `redis.js` directly)
- A **Sentry** project DSN for error tracking
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
| Production | `node server.js` | Starts the server without nodemon — use this in production environments |
| Test | `npm test` | Runs the full Jest suite with `NODE_ENV=testing` |

---

## Environment Variables

Create a `.env` file in the project root. All variables listed below are required.

| Variable | Description |
|---|---|
| `PORT` | Port the Express server listens on |
| `MONGO_URI` | MongoDB Atlas connection string (must point to a cluster with a configured vector search index) |
| `NODE_ENV` | Runtime environment — `development`, `production`, or `testing` |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens and to generate CSRF tokens |
| `EMAIL_USER` | Gmail address used as the SMTP sender |
| `EMAIL_PASS` | Gmail App Password for the SMTP sender account |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 client ID from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 client secret from Google Cloud Console |
| `GEMINI_API_KEY` | Google AI API key used for generating message embeddings (`gemini-embedding-2`) |
| `SARVAM_API_KEY` | Sarvam AI API subscription key used for chat completions and title generation |
| `SENTRY_DSN` | Sentry project DSN for structured error tracking and alerting |
| `REDIS_HOST` | Hostname of the Redis instance used for the JWT token blacklist |
| `REDIS_PORT` | Port of the Redis instance |
| `REDIS_PASSWORD` | Password for the Redis instance |

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
SENTRY_DSN=
REDIS_HOST=
REDIS_PORT=
REDIS_PASSWORD=
```

---

## API Routes

All routes are prefixed with `/v1`. A `✓` in the **Auth** column means the request must include a valid JWT in the `token` cookie. Non-GET requests additionally require a valid CSRF token in the `x-csrf-token` header.

**CSRF flow:** Before any state-changing request, call `GET /v1/csrf-token` and read the token from `data.csrfToken` in the response body. Include it as `x-csrf-token: <token>` on every subsequent POST, PATCH, and DELETE request. The token does not expire between requests — only re-fetch it if a request is rejected with a CSRF error.

### App-level

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | Returns server status, uptime, and timestamp |
| `GET` | `/v1/csrf-token` | — | Issues a CSRF token; must be fetched before any state-changing request |
| `GET` | `/api-docs` | — | Swagger UI — only available when `NODE_ENV=development` |

### Authentication — `/v1/auth`

> Auth routes are rate-limited to **10 requests per minute per IP** in non-testing environments.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/auth/register` | — | Register a new user. Sends a verification email. Body: `{ fullName: { firstName, lastName }, email, password }`. Password must be at least 8 characters. |
| `GET` | `/v1/auth/verify-email` | — | Verify email address using the token sent at registration. Query: `?token=<token>` |
| `POST` | `/v1/auth/login` | — | Authenticate with email and password. Sets `token` cookie on success. Body: `{ email, password }` |
| `POST` | `/v1/auth/logout` | ✓ | Blacklists the current JWT in Redis and clears the authentication cookie |
| `POST` | `/v1/auth/forgot-password` | — | Request a password reset link via email. Body: `{ email }` |
| `POST` | `/v1/auth/reset-password` | — | Reset password using the reset token. Query: `?token=<token>`. Body: `{ password }` |
| `GET` | `/v1/auth/google` | — | Initiate Google OAuth 2.0 login flow |
| `GET` | `/v1/auth/google/callback` | — | OAuth 2.0 callback — handled by Passport, sets `token` cookie on success |

### Chats — `/v1/chat`

> Chat routes are rate-limited to **5 requests per minute per IP** in non-testing environments.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/chat/create` | ✓ | Create a new chat session. Increments `chatCount` on the user's analytics document. |
| `GET` | `/v1/chat/read` | ✓ | Retrieve all chat sessions belonging to the authenticated user |
| `PATCH` | `/v1/chat/update/:id` | ✓ | Update the name of a chat session. Body: `{ chatName }` |
| `DELETE` | `/v1/chat/delete/:id` | ✓ | Delete a chat session and all of its messages (cascading) |

### Messages — `/v1/message`

> Message routes are rate-limited to **50 requests per minute per IP** in non-testing environments.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/v1/message/create` | ✓ | Send a user message. Runs the full AI pipeline: embedding, vector memory, AI response, auto-title on first message. Increments `messageCount` on the user's analytics document. Body: `{ chatId, messageContent }` |
| `GET` | `/v1/message/read/:chatId` | ✓ | Retrieve all messages for a given chat session |
| `PATCH` | `/v1/message/update/:id` | ✓ | Update the content of an existing message. Body: `{ chatId, messageContent }` |
| `DELETE` | `/v1/message/delete/:id` | ✓ | Delete a specific message. Body: `{ chatId }` |

### Analytics — `/v1/analytics`

> Analytics routes require the `admin` role.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/analytics/:userId` | ✓ Admin | Retrieve the analytics document for a given user — `chatCount`, `messageCount`, `lastActiveAt` |

### Response Envelope

All endpoints return a consistent JSON envelope:

```json
{
  "success": true | false,
  "data": { ... } | null,
  "error": "Error message" | null
}
```

> **Note on error responses:** The global error handler always returns the `{ success, data, error }` envelope. In `development`, a `stack` field is added at the top level alongside the standard three fields. In `production`, only the three standard fields are returned.

### Selected Response Shapes

The three endpoints that return data worth knowing upfront:

**`POST /v1/message/create`** — the AI response text lives in `data.response`, not `data.message`:
```json
{
  "success": true,
  "data": {
    "message": "Message created successfully",
    "response": "<AI response text>"
  },
  "error": null
}
```

**`GET /v1/chat/read`** — chat sessions are in `data.chats`:
```json
{
  "success": true,
  "data": {
    "message": "Chats fetched successfully",
    "chats": [ { "_id": "...", "userId": "...", "chatName": "...", "createdAt": "...", "updatedAt": "..." } ]
  },
  "error": null
}
```

**`GET /v1/message/read/:chatId`** — messages are in `data.messages`:
```json
{
  "success": true,
  "data": {
    "message": "Messages fetched successfully",
    "messages": [ { "_id": "...", "chatId": "...", "messageContent": "...", "role": "user" | "ai", "createdAt": "...", "updatedAt": "..." } ]
  },
  "error": null
}
```

---

## Running Tests

The test suite uses **Jest** and **Supertest**. An in-memory MongoDB instance (`mongodb-memory-server`) is spun up automatically — no live database connection is required. All external services (Sarvam AI, Google Gemini, Nodemailer, Redis) are mocked using `jest.mock()`, so the suite runs fully offline with zero API calls.

```bash
# Run all tests
npm test
```

Jest is configured to use Babel (`babel-jest`) for ESM transpilation. The `cross-env` package sets `NODE_ENV=testing`, which disables rate limiting and CSRF protection during the test run.

### Test Coverage

| File | Tests | Scope |
|---|---|---|
| `auth.test.js` | 22 | Register (201, 409, 400 missing field, 400 short password, userAnalytics created on registration), login (404, 400 unverified, 400 wrong password, 200), verify-email (400 no token, 404 wrong token, 200 already verified, 200, 400 expired), logout (200, 401 blacklisted, 401 no cookie), forgot-password (200 not found, 200 found), reset-password (400 invalid token, 400 expired, 200) |
| `chat.test.js` | 11 | Create (201, 401, chatCount increments), read (200, 401), update (200, 400 wrong id, 401), delete (200, 400 wrong id, 401) |
| `message.test.js` | 13 | Create (201, 404, 401, messageCount increments), read (200, 404, 401), update (200, 404, 401), delete (200, 404, 401) |
| `analytics.test.js` | 4 | 401 no cookie, 403 non-admin role, 404 no analytics document, 200 success |
| **Total** | **50** | |

---

## Troubleshooting

**Server starts but all database operations fail or hang**

MongoDB Atlas requires the connecting IP address to be whitelisted. In Atlas, navigate to **Network Access → Add IP Address** and add your current IP, or `0.0.0.0/0` to allow all IPs during development. This is the most common reason the server appears to start correctly but every request fails silently at the database layer.

**Nodemailer authentication error on registration**

Gmail requires an App Password, not your regular account password. Go to **Google Account → Security → 2-Step Verification → App Passwords**, generate a password for "Mail", and use that as `EMAIL_PASS`. Using your account password directly will be rejected even if the credentials look correct.

**`$vectorSearch` fails at runtime with a pipeline stage error**

The Atlas Vector Search index must be named exactly `vector_index` — the name is case-sensitive and hardcoded in `vector.service.js`. If the index was created with any other name, the `$vectorSearch` aggregation stage will fail at runtime. Additionally, a newly created index takes 1–2 minutes to reach **Active** status in Atlas before queries work — creating the index and immediately starting the server may produce errors until it activates.

**Redis connection refused on startup**

Check that `REDIS_HOST`, `REDIS_PORT`, and `REDIS_PASSWORD` are all set correctly in `.env`. The Redis client attempts to connect on startup and the process exits with code 1 if it cannot connect — a failed Redis connection prevents the server from starting entirely. If using Redis Cloud, ensure `REDIS_HOST` is the full endpoint shown in your Redis Cloud dashboard and `REDIS_PORT` matches exactly.

**Rate limiting, CSRF, or cookie behaviour is unexpected in development**

`NODE_ENV` must be set explicitly in `.env` — it does not default to any value. If it is unset: rate limiters are active on all routes, CSRF protection applies to all non-GET requests, cookies are set without `secure: true`, and Winston logs at `info` level rather than `http`. Always set `NODE_ENV=development` in your local `.env` file.

---

## Before You Deploy

This checklist must be completed before deploying to any environment beyond localhost. Several of these map directly to items in Known Issues below.

- [ ] **Fix hardcoded `localhost:3000` URLs** — add a `BASE_URL` environment variable to `config/index.js` and replace all three hardcoded values in `auth.controller.js` (the verify-email and reset-password email links) and `config/google.strategy.js` (the OAuth callback URL). Update the Google Cloud Console OAuth client's authorised redirect URI to match.
- [ ] **Fix `email.service.js` error swallowing** — add `throw err` after `logger.error(err)` in the catch block so email failures propagate correctly and the registration cleanup logic in `registerController` actually runs.
- [ ] **Verify `NODE_ENV=production`** — this already enables `secure: true` on JWT cookies, suppresses stack traces from error responses, and disables Winston console transport. It must be set explicitly on the production server; it does not default.
- [ ] **Verify Redis username** — the Redis client has `username: "default"` hardcoded in `redis.js`. This is correct for Redis Cloud and most managed providers, but if your instance uses a non-default username it must be changed directly in that file (or moved to an env variable).
- [ ] **Use a strong `JWT_SECRET`** — in production this must be a minimum of 32 cryptographically random bytes. `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` generates a suitable value.
- [ ] **Verify Sentry DSN** — ensure `SENTRY_DSN` points to your production Sentry project, not a development or staging one. Errors from all environments reporting to the same project makes alerting unreliable.
- [ ] **Swagger UI is development-only** — `GET /api-docs` is only mounted when `NODE_ENV === "development"`. Confirm it is not accessible in production before launch.

---

## Known Issues

Bugs present in the current codebase, documented here for transparency. Ordered by severity — most critical first. **When a fix is committed and tests pass, remove the entry. Do not annotate with strikethrough.**

**`email.service.js` swallows errors** *(dead code, data integrity risk)* — `sendMailer` wraps `transportor.sendMail` in a try/catch that logs the error but never re-throws. As a result, the cleanup block in `registerController` — which deletes the user and analytics documents if the email fails — is dead code that never runs. If email delivery fails silently, the user document is created and left in an unverified state with no path to clean it up from the request cycle. Fix: add `throw err` after `logger.error(err)` in `email.service.js`, then write a test that mocks `sendMailer` to reject and asserts neither the user nor analytics document exists afterward.

**Three hardcoded `localhost:3000` URLs** *(breaks all non-local deployments)* — the following must be changed before deploying anywhere:
- `auth.controller.js` — verify-email link in the registration email
- `auth.controller.js` — reset-password link in the forgot-password email
- `config/google.strategy.js` — Google OAuth callback URL

Fix: add a `BASE_URL` environment variable to `config/index.js` and replace all three hardcoded values with it.

---

## Project Status

### ✅ Phase 1 — Foundation (Complete)

- [x] Express application setup with Helmet, Morgan, and cookie-parser
- [x] MongoDB connection via Mongoose
- [x] Centralised environment configuration (`config/index.js`)
- [x] Winston structured logging (file + console, environment-aware log levels)
- [x] Global error handler with consistent `{ success, data, error }` envelope and dev/prod response differences
- [x] Process-level uncaught exception and unhandled rejection handlers
- [x] `GET /health` endpoint returning status, uptime, and timestamp

### ✅ Phase 2 — Authentication (Complete)

- [x] User model with indexed fields (`email`, `googleID`, `verificationToken`, `resetToken`)
- [x] Zod validation schemas and `validateRequest` middleware
- [x] Register with email verification (24-hour token)
- [x] Login with JWT cookie (7-day expiry, `httpOnly`, `sameSite: lax`)
- [x] Logout with cookie clear
- [x] Forgot password and reset password flows (10-minute token, no email enumeration)
- [x] Google OAuth 2.0 via Passport.js (find-or-create, auto-verified)
- [x] JWT auth middleware (`authSystem`) and role guard middleware (`requireRole`)
- [x] Rate limiting on auth routes (10 req/min, bypassed in test env)

### ✅ Phase 3 — Core Features (Complete)

- [x] Chat model with `userId` index and default name `"New Chat"`
- [x] Message model with `chatId` index and `role` enum (`user` / `ai`)
- [x] Full chat CRUD with ownership enforcement (all queries include `userId`)
- [x] Full message CRUD with ownership enforcement
- [x] Cascading delete — chat deletion removes all associated messages via `deleteMany`

### ✅ Phase 4 — AI Layer (Complete)

- [x] `embedding: [Number]` field added to Message model
- [x] `vector.service.js` — Gemini `gemini-embedding-2` embedding generation (768 dimensions)
- [x] MongoDB Atlas `$vectorSearch` with `chatId` filter, cosine similarity, score threshold `0.75`, top 5 results
- [x] `ai.service.js` — Sarvam AI `sarvam-m` completions combining long-term memory (vector search) and short-term memory (last 4 messages)
- [x] Auto-title generation triggered on first message of each chat session
- [x] `<think>` tag stripping from model output before returning to client

### ✅ Phase 5 — Infrastructure (Complete)

- [x] CSRF protection — double-submit cookie pattern via `csrf-csrf`, token issued at `GET /v1/csrf-token`, validated via `x-csrf-token` header, bypassed in testing
- [x] Swagger/OpenAPI 3.0 documentation — JSDoc annotations on all routes, spec generated by `swagger-jsdoc`, Swagger UI at `/api-docs` in development only
- [x] Sentry error tracking — `instrument.js` initialised before all other imports in `server.js`; Express error handler wired via `Sentry.setupExpressErrorHandler`
- [x] Expanded rate limiting — `authLimiter` (10/min), `chatLimiter` (5/min), `messageLimiter` (50/min) across all route groups
- [x] Redis token blacklist — JWT stored in Redis on logout with TTL matching the token's remaining lifetime; `authSystem` checks `client.exists()` on every authenticated request
- [x] User analytics — `userAnalytics` model tracking `chatCount`, `messageCount`, and `lastActiveAt` per user; document created on registration, incremented on chat and message creation; admin-only read endpoint
- [x] Full test suite — 50 tests across 4 files; all external services mocked; Redis mocked via `jest.mock`

### 🔜 Phase 6 — Frontend + Deferred Backend (Planned)

The following backend items were deferred because they are tightly coupled to the UI or require fixes before going to production:

- [ ] Fix all items listed in Known Issues above
- [ ] Socket.io server — real-time bidirectional communication for streaming AI responses
- [ ] Background jobs — offload embedding generation from the synchronous request cycle
- [ ] Remaining analytics (system, error, chat, AI, performance metrics)

Frontend work:
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