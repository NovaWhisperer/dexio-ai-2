import userModel from "../models/user.model.js"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import sendMailer from "../services/email.service.js"

const registerController = async (req, res, next) => {
    const { fullName, email, password } = req.data

    const emailExists = await userModel.findOne({ email })

    if (emailExists) {
        return res.status(409).json({
            message: "Email already exists"
        })
    }

    const hashPassword = await bcrypt.hash(password, 10)

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const verificationTokenExpiry = new Date().getTime() + 24 * 60 * 60 * 1000

    try {
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

        sendMailer(email, "Verify your email", `http://localhost:3000/v1/auth/verify-email?token=${verificationToken}`)

        res.status(201).json({
            message: "User created successfully"
        })

    } catch (err) {
        next(err)
    }
}

const verifyEmailController = async (req, res, next) => {

    try {
        const { token } = req.query;
        const user = await userModel.findOne({ verificationToken: token })

        if (!user) {
            return res.status(404).json({
                message: "Invalid Token"
            })
        }

        if (user.verified === true) {
            return res.status(200).json({
                message: "User already verified"
            })
        }

        if (user.verificationTokenExpiry > (new Date().getTime())) {

            await userModel.findOneAndUpdate({ verificationToken: token }, { $set: { verified: true } })

            return res.status(200).json({
                message: "User email verified successfully"
            })
        }
        else {  
            return res.status(400).json({
                message:"Token had expired. Register again"
            })
        }
    } catch (err) {
        next(err)
    }
}

const loginController = (req, res) => {

}

const logoutController = (req, res) => {

}

const googleController = (req, res) => {

}

const googleCallbackController = (req, res) => {

}

const forgotPasswordController = (req, res) => {

}

const resetPasswordController = (req, res) => {

}


export { registerController, loginController, logoutController, verifyEmailController, googleController, googleCallbackController, forgotPasswordController, resetPasswordController }