import express from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.js"
import morgan from "morgan"
import { logger } from "./utils/logger.js"
import authRoutes from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import passport from "../config/google.strategy.js"
import chatRoutes from "./routes/chat.route.js"
import messageRoutes from "./routes/message.route.js"
import { doubleCsrfProtection, generateCsrfToken } from "./middlewares/csrf.middleware.js"
import { NODE_ENV } from "../config/index.js"

const app = express()

app.use(helmet())

app.use(morgan("combined", { stream: { write: (message) => logger.http(message) } }))

app.use(express.json())

app.use(cookieParser())

app.get("/v1/csrf-token", (req, res) => {
    const csrfToken = generateCsrfToken(req, res);
    res.json({ success: true, data: { csrfToken }, error: null });
})


if (NODE_ENV !== "testing") { app.use(doubleCsrfProtection) }


app.use(passport.initialize())

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

app.use("/v1/auth", authRoutes)
app.use("/v1/chat", chatRoutes)
app.use("/v1/message", messageRoutes)

app.use((req, res, next) => {
    const defaultError = Error("Route not found")
    defaultError.statusCode = 404
    next(defaultError)
})

app.use(errorHandler)

export default app