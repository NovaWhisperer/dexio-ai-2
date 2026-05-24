import express from "express"
import { authSystem } from "../middlewares/auth.middleware.js"
import { chatCreateController, chatDeleteController, chatReadController, chatUpdateController } from "../controllers/chat.controller.js"

const router = express.Router()

/**
 * @openapi
 * /v1/chat/create:
 *   post:
 *     summary: create chat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: "Chat created successfully" 
 */
router.post("/create", authSystem, chatCreateController)

/**
 * @openapi
 * /v1/chat/read:
 *   get:
 *     summary: read chat
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Chats fetched successfully"
 */
router.get("/read", authSystem, chatReadController)

/**
 * @openapi
 * /v1/chat/update/{id}:
 *   patch:
 *     summary: update chat
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Chat ID"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatName:
 *                 type: string
 *                 example: "Test Chat"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Chat name updated successfully" 
 *       400:
 *         description:"ChatId is wrong"
 */
router.patch("/update/:id", authSystem, chatUpdateController)

/**
 * @openapi
 * /v1/chat/delete/{id}:
 *   delete:
 *     summary: delete chat
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Chat ID"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Chat deleted successfully"
 *       400:
 *         description:"ChatId is wrong"
 */
router.delete("/delete/:id", authSystem, chatDeleteController)

export default router