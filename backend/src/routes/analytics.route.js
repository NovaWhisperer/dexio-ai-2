import express from "express"
import { userAnalyticsController } from "../controllers/analytics.controller.js"
import { authSystem, requireRole } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @openapi
 * /v1/analytics/{userId}:
 *   get:
 *     summary: user analytics
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: "User ID"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       401:
 *         description: "Unauthorized: No token provided"
 *       403:
 *         description: "Forbidden: Access denied"
 *       404:
 *         description: "User Analytics data not found"
 *       200:
 *         description: "User analytics data fetched successfully"
 */
router.get("/:userId", authSystem, requireRole(["admin"]), userAnalyticsController)


export default router