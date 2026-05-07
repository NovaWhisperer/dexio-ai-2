import express, { Router } from "express"

import { registerController, loginController, logoutController, verifyEmailController, googleController, googleCallbackController, forgotPasswordController, resetPasswordController } from "../controllers/auth.controller.js"
import { validateRequest } from "../middlewares/validation.middleware.js"
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../schemas/auth.schema.js"
import { authSystem } from "../middlewares/auth.middleware.js"
import passport from "../../config/google.strategy.js"
import limiter from "../middlewares/rateLimiter.middleware.js"
import { NODE_ENV } from "../../config/index.js"

const router = express.Router()

if (NODE_ENV !== "testing") { router.use(limiter) }


router.post("/register", validateRequest(registerSchema), registerController)
router.post("/login", validateRequest(loginSchema), loginController)
router.post("/logout", authSystem, logoutController)
router.post("/forgot-password", validateRequest(forgotPasswordSchema), forgotPasswordController)
router.post("/reset-password", validateRequest(resetPasswordSchema), resetPasswordController)
router.get("/verify-email", verifyEmailController)
router.get("/google", googleController)
router.get("/google/callback", passport.authenticate("google"), googleCallbackController)

export default router