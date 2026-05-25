import { config } from "dotenv";

config()

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI
const NODE_ENV = process.env.NODE_ENV
const EMAIL_USER = process.env.EMAIL_USER
const EMAIL_PASS = process.env.EMAIL_PASS
const JWT_SECRET = process.env.JWT_SECRET
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const SARVAM_API_KEY = process.env.SARVAM_API_KEY
const SENTRY_DSN = process.env.SENTRY_DSN

export { PORT, MONGO_URI, NODE_ENV, EMAIL_USER, EMAIL_PASS, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GEMINI_API_KEY, SARVAM_API_KEY, SENTRY_DSN } 