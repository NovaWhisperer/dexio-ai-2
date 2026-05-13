import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"

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

        await messageModel.create({ chatId, messageContent })

        res.status(201).json({
            success: true,
            data: { message: "Message created successfully" },
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