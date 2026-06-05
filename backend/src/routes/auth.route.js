import express, { Router } from "express";
import {
  registerController,
  loginController,
  logoutController,
  verifyEmailController,
  googleController,
  googleCallbackController,
  forgotPasswordController,
  resetPasswordController,
} from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validation.middleware.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import { authSystem } from "../middlewares/auth.middleware.js";
import passport from "../../config/google.strategy.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { NODE_ENV } from "../../config/index.js";

const router = express.Router();

if (NODE_ENV !== "testing") {
  router.use(authLimiter);
}

/**
 * @openapi
 * /v1/auth/register:
 *   post:
 *     summary: register user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Test"
 *               lastName:
 *                 type: string
 *                 example: "User"
 *               email:
 *                 type: string
 *                 example: "test@test.com"
 *               password:
 *                 type: string
 *                 example: "testtest"
 *     responses:
 *       201:
 *         description: "User created successfully"
 *       409:
 *         description: "Email already exists"
 */
router.post("/register", validateRequest(registerSchema), registerController);

/**
 * @openapi
 * /v1/auth/login:
 *   post:
 *     summary: login user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.com"
 *               password:
 *                 type: string
 *                 example: "testtest"
 *     responses:
 *       200:
 *         description: "User login successfully"
 *       404:
 *         description: "User not found"
 *       400:
 *         description: "User not registered or Invalid password"
 */
router.post("/login", validateRequest(loginSchema), loginController);

/**
 * @openapi
 * /v1/auth/logout:
 *   post:
 *     summary: logout user
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "User logout successfully"
 */
router.post("/logout", authSystem, logoutController);

/**
 * @openapi
 * /v1/auth/forgot-password:
 *   post:
 *     summary: forgot password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "test@test.com"
 *     responses:
 *       200:
 *         description: "Password reset link sent successfully"
 */
router.post(
  "/forgot-password",
  validateRequest(forgotPasswordSchema),
  forgotPasswordController,
);

/**
 * @openapi
 * /v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Reset password token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: "testtest"
 *     responses:
 *       200:
 *         description: "Password reset successfully"
 *       400:
 *         description: "Invalid token or reset token expired"
 */
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  resetPasswordController,
);

/**
 * @openapi
 * /v1/auth/verify-email:
 *   get:
 *     summary: verify email
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: "Email verification token"
 *     responses:
 *       200:
 *         description: "User email verified successfully"
 *       404:
 *         description: "Invalid Token"
 *       400:
 *         description: "Token not found or User already verified or Token had expired. Register again"
 */
router.get("/verify-email", verifyEmailController);

/**
 * @openapi
 * /v1/auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     responses:
 *       302:
 *         description: "Redirects to Google login page"
 */
router.get("/google", googleController);

/**
 * @openapi
 * /v1/auth/google/callback:
 *   get:
 *     summary: google callback
 *     responses:
 *       200:
 *         description: "User verified successfully"
 *       401:
 *         description: "Authentication failed"
 */
router.get(
  "/google/callback",
  passport.authenticate("google"),
  googleCallbackController,
);

export default router;
