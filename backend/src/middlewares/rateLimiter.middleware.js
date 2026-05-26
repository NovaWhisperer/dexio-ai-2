import { rateLimit } from 'express-rate-limit'

const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: "Too many authentication attempts. Please try again later."
    }
})

const chatLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: "Too many chat requests. Please slow down."
    }
})

const messageLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    limit: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        data: null,
        error: "Too many messages sent. Please slow down."
    }
})

export { authLimiter, chatLimiter, messageLimiter }