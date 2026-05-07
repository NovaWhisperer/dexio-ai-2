import express from "express"
import { errorHandler } from "./middlewares/errorHandler.middleware.js"
import morgan from "morgan"
import { logger } from "./utils/logger.js"
import authRoutes from "./routes/auth.route.js"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import passport from "../config/google.strategy.js"

const app = express()

app.use(helmet())

app.use(morgan("combined", { stream: { write: (message) => logger.http(message) } }))

app.use(express.json())

app.use(cookieParser())

app.use(passport.initialize())

app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    })
})

app.use("/v1/auth", authRoutes)

app.use((req, res, next) => {
    const defaultError = Error("Route not found")
    defaultError.statusCode = 404
    next(defaultError)
})

app.use(errorHandler)

export default app