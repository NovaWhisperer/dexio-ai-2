import { NODE_ENV } from "../../config/index.js";

const errorHanler = ((err, req, res, next) => {
    let statusCode = err.statusCode
    let errMessage = err.message
    let stack = err.stack

    statusCode = statusCode || 500
    errMessage = errMessage || "Internal Server Error"

    if (NODE_ENV === "development") {
        res.status(statusCode).json({ errMessage, stack })

    }
    else {
        res.status(statusCode).json({ errMessage })
    }
})

export { errorHanler }
