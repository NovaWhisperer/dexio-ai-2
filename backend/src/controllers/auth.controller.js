import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import sendMailer from "../services/email.service.js"
import jwt from "jsonwebtoken"
import { JWT_SECRET, NODE_ENV } from "../../config/index.js"
import cookie from "cookie-parser"
import passport from "passport"


const registerController = async (req, res, next) => {

    try {
        const { fullName, email, password } = req.data

        const emailExists = await userModel.findOne({ email })

        if (emailExists) {
            return res.status(409).json({
                success: false,
                data: null,
                error: "Email already exists"
            })
        }

        const hashPassword = await bcrypt.hash(password, 10)

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const verificationTokenExpiry = new Date().getTime() + 24 * 60 * 60 * 1000

        const user = await userModel.create({
            fullName: {
                firstName: fullName.firstName,
                lastName: fullName.lastName
            }
            , email,
            password: hashPassword,
            verificationToken,
            verificationTokenExpiry
        })

        try {
            await sendMailer(email, "Verify your email", `http://localhost:3000/v1/auth/verify-email?token=${verificationToken}`)
        } catch (err) {
            await userModel.deleteOne({ email })
            return next(err)
        }

        res.status(201).json({
            success: true,
            data: { message: "User created successfully" },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const verifyEmailController = async (req, res, next) => {

    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Token not found"
            })
        }

        const user = await userModel.findOne({ verificationToken: token })

        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Invalid Token"
            })
        }

        if (user.verified === true) {
            return res.status(400).json({
                success: true,
                data: { message: "User already verified" },
                error: null
            })
        }

        if (user.verificationTokenExpiry > (new Date().getTime())) {

            await userModel.findOneAndUpdate({ verificationToken: token }, { $set: { verified: true } })

            return res.status(200).json({
                success: true,
                data: { message: "User email verified successfully" },
                error: null
            })
        }
        else {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Token had expired. Register again"
            })
        }
    } catch (err) {
        next(err)
    }
}

const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.data

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "User not found"
            })
        }

        if (user.verified === false) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "User not registered"
            })
        }

        const checkPassword = await bcrypt.compare(password, user.password)

        if (!checkPassword) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Invalid password"
            })
        }

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })

        res.cookie("token", token, { httpOnly: true, secure: (NODE_ENV === "production"), sameSite: "lax" })

        return res.status(200).json({
            success: true,
            data: { message: "User login successfully" },
            error: null
        })
    } catch (err) {
        next(err)
    }
}

const logoutController = async (req, res, next) => {
    try {
        res.clearCookie("token")

        return res.status(200).json({
            success: true,
            data: { message: "User logout successfully" },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(200).json({
                success: true,
                data: { message: "Password reset link sent successfully" },
                error: null
            })
        }

        const resetToken = crypto.randomBytes(32).toString('hex')

        const resetTokenExpiry = new Date().getTime() + 10 * 60 * 1000

        await userModel.findOneAndUpdate({ email }, { $set: { resetToken, resetTokenExpiry } })

        await sendMailer(email, "Reset your password", `http://localhost:3000/v1/auth/reset-password?token=${resetToken}`)

        return res.status(200).json({
            success: true,
            data: { message: "Password reset link sent successfully" },
            error: null
        })
    } catch (err) {
        next(err)
    }
}

const resetPasswordController = async (req, res, next) => {
    try {
        const { token } = req.query

        const user = await userModel.findOne({ resetToken: token })

        if (!user) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Invalid token"
            })
        }


        if (user.resetTokenExpiry < new Date().getTime()) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "Reset token expired"
            })
        }

        const { password } = req.body

        const hashedPassword = await bcrypt.hash(password, 10)

        user.password = hashedPassword
        user.resetToken = undefined
        user.resetTokenExpiry = undefined
        await user.save()

        res.status(200).json({
            success: true,
            data: { message: "Password reset successfully" },
            error: null
        })
    } catch (err) {
        next(err)
    }
}

const googleController = async (req, res, next) => {
    (passport.authenticate("google", { scope: ["profile"] }))(req, res, next)
}

const googleCallbackController = async (req, res, next) => {
    try {
        const user = req.user

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "1d" })

        res.cookie("token", token, { httpOnly: true, secure: (NODE_ENV === "production"), sameSite: "lax" })

        res.status(200).json({
            success: true,
            data: { message: "User verified successfully" },
            error: null
        })
    } catch (err) {
        next(err)
    }
}


export { registerController, verifyEmailController, loginController, logoutController, forgotPasswordController, resetPasswordController, googleController, googleCallbackController }