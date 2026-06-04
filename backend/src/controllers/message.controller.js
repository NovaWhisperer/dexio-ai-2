import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"
import userAnalyticsModel from "../models/userAnalytics.model.js"
import { generateChatTitle, generateResponse } from "../services/ai.service.js"
import { createEmbedding } from "../services/vector.service.js"

const messageCreateController = async (req, res, next) => {
    try {
        const { chatId, messageContent } = req.body
        const { id } = req.user

        const chat = await chatModel.findOne({ _id: chatId, userId: id })

        if (!chat) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Chat not found"
            })
        }

        const message = await messageModel.create({ chatId, messageContent })

        const newembedding = await createEmbedding(message.messageContent)

        await messageModel.findByIdAndUpdate(message._id, { $set: { embedding: newembedding } })

        if (await messageModel.countDocuments({ chatId }) === 1) {
            const updatedTitle = await generateChatTitle(message.messageContent)

            await chatModel.findOneAndUpdate({ _id: chatId }, { chatName: updatedTitle })
        }

        const response = await generateResponse(message.messageContent, message.chatId)

        await messageModel.create({ chatId, messageContent: response, role: "ai" })

        await userAnalyticsModel.findOneAndUpdate({ userId: id }, { $inc: { messageCount: 1 }, $set: { lastActiveAt: Date.now() } })

        res.status(201).json({
            success: true,
            data: { message: "Message created successfully", response },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const messageReadController = async (req, res, next) => {
    try {

        const { chatId } = req.params
        const { id } = req.user

        const chat = await chatModel.findOne({ _id: chatId, userId: id })

        if (!chat) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Chat not found"
            })
        }

        const messages = await messageModel.find({ chatId })

        res.status(200).json({
            success: true,
            data: {
                message: "Messages fetched successfully",
                messages
            },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const messageUpdateController = async (req, res, next) => {
    try {
        const { chatId, messageContent } = req.body
        const { id } = req.params

        const message = await messageModel.findOne({ _id: id, chatId })
        if (!message) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Message not found"
            })
        }

        await messageModel.findOneAndUpdate(
            { _id: id },
            { $set: { messageContent: messageContent } }
        )

        res.status(200).json({
            success: true,
            data: {
                message: "Message updated successfully"
            },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const messageDeleteController = async (req, res, next) => {
    try {
        const { chatId } = req.body
        const { id } = req.params

        const message = await messageModel.findOne({ _id: id, chatId })

        if (!message) {
            return res.status(404).json({
                success: false,
                data: null,
                error: "Message not found"
            })
        }

        await messageModel.findOneAndDelete({ _id: id })

        res.status(200).json({
            success: true,
            data: {
                message: "Message deleted successfully"
            },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

export { messageCreateController, messageReadController, messageUpdateController, messageDeleteController }