import jwt from "jsonwebtoken"
import userModel from "../models/user.model.js"
import { JWT_SECRET } from "../../config/index.js"

const authSystem = async (req, res, next) => {
    const cookie = req.cookies["token"]

    try {
        const decoded = jwt.verify(cookie, JWT_SECRET)
        req.decoded = decoded
    } catch (err) {
        err.statusCode = 401
        return next(err)
    }

    const { id, role } = req.decoded
    req.user = { id, role }
    next()
}

const requireRole = (roles) => {
    return (req, res, next) => {
        try {
            const { role } = req.user
            let checkingRole = roles.includes(role)
            if (checkingRole) {
                next()
            }
            else {
                next(new Error("Unauthorized role"))
            }
        } catch (err) {
            next(err)
        }
    }
}

export { authSystem, requireRole }