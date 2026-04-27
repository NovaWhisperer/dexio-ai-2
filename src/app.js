import express from "express"
import { errorHanler } from "./middleware/errorHandler.js"

const app = express()

app.use(express.json())

app.use((req, res, next) => {
    const defaultError = Error("Route not found ")
    defaultError.statusCode = 404
    next(defaultError)
})


app.use(errorHanler)

export default app