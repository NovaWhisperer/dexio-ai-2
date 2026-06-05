import express from "express";
import { authSystem } from "../middlewares/auth.middleware.js";
import {
  messageCreateController,
  messageDeleteController,
  messageReadController,
  messageUpdateController,
} from "../controllers/message.controller.js";
import { messageLimiter } from "../middlewares/rateLimiter.middleware.js";
import { NODE_ENV } from "../../config/index.js";

const router = express.Router();

if (NODE_ENV !== "testing") {
  router.use(messageLimiter);
}

/**
 * @openapi
 * /v1/message/create:
 *   post:
 *     summary: create message
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: "Chat Id"
 *               messageContent:
 *                  type: string
 *                  example: "Message Content"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       201:
 *         description: "Message created successfully"
 *       404:
 *         description: "Chat not found"
 */
router.post("/create", authSystem, messageCreateController);

/**
 * @openapi
 * /v1/message/read/{chatId}:
 *   get:
 *     summary: read message
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: "Chat ID"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Messages fetched successfully"
 *       404:
 *         description: "Chat not found"
 */
router.get("/read/:chatId", authSystem, messageReadController);

/**
 * @openapi
 * /v1/message/update/{id}:
 *   patch:
 *     summary: update message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Message Id"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: "Chat Id"
 *               messageContent:
 *                 type: string
 *                 example: "Message content"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Message updated successfully"
 *       400:
 *         description: "Message not found"
 */
router.patch("/update/:id", authSystem, messageUpdateController);

/**
 * @openapi
 * /v1/message/delete/{id}:
 *   delete:
 *     summary: delete message
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "Message Id"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *                 example: "Chat Id"
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: "Message deleted successfully"
 *       404:
 *         description: "Message not found"
 */
router.delete("/delete/:id", authSystem, messageDeleteController);

export default router;
