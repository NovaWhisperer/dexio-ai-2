import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../../config/index.js"
import { client } from "../db/redis.js"

const authSystem = async (req, res, next) => {
    const cookie = req.cookies["token"]

    if (!cookie) {
        const err = new Error("Unauthorized: No token provided")
        err.statusCode = 401
        return next(err)
    }

    try {
        const decoded = jwt.verify(cookie, JWT_SECRET)

        const value = await client.exists(cookie)

        if (value === 1) {
            const error = new Error("Unauthorized: Invalid or expired token")
            error.statusCode = 401
            return next(error)
        }

        req.decoded = decoded
    } catch (err) {
        const error = new Error("Unauthorized: Invalid or expired token")
        error.statusCode = 401
        return next(error)
    }

    const { id, role } = req.decoded
    req.user = { id, role }

    next()
}

const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            const { role } = req.user

            const checkingRole = roles.includes(role)

            if (checkingRole) {
                return next()
            }

            const err = new Error("Forbidden: Access denied")
            err.statusCode = 403
            next(err)

        } catch (err) {
            next(err)
        }
    }
}

export { authSystem, requireRole }