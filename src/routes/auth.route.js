import express, { Router } from "express"

import { registerController, loginController, logoutController, verifyEmailController, googleController, googleCallbackController, forgotPasswordController, resetPasswordController } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/register", registerController)
router.post("/login", loginController)
router.post("/logout", logoutController)
router.get("/verify-email", verifyEmailController)
router.get("/google", googleController)
router.get("/google/callback", googleCallbackController)
router.post("/forget-password", forgotPasswordController)
router.post("/reset-password", resetPasswordController)

export default router