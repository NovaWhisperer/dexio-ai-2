import chatModel from "../models/chat.model.js"
import messageModel from "../models/message.model.js"

const chatCreateController = async (req, res, next) => {
    try {
        const { id } = req.user
        await chatModel.create({ userId: id })

        res.status(201).json({
            success: true,
            data: { message: "Chat created successfully" },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const chatReadController = async (req, res, next) => {
    try {
        const { id } = req.user
        const chats = await chatModel.find({ userId: id })

        res.status(200).json({
            success: true,
            data: {
                message: "Chats fetched successfully",
                chats
            },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const chatUpdateController = async (req, res, next) => {
    try {
        const { id: chatId } = req.params
        const { chatName } = req.body
        const { id } = req.user

        const chats = await chatModel.findOneAndUpdate(
            { _id: chatId, userId: id },
            { $set: { chatName: chatName } }
        )

        if (!chats) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "ChatId is wrong"
            })
        }

        res.status(200).json({
            success: true,
            data: { message: "Chat name updated successfully" },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

const chatDeleteController = async (req, res, next) => {
    try {
        const { id: chatId } = req.params
        const { id } = req.user

        const chats = await chatModel.findOneAndDelete({
            _id: chatId,
            userId: id
        })

        if (!chats) {
            return res.status(400).json({
                success: false,
                data: null,
                error: "ChatId is wrong"
            })
        }

        await messageModel.deleteMany({ chatId: chatId })

        res.status(200).json({
            success: true,
            data: { message: "Chat deleted successfully" },
            error: null
        })

    } catch (err) {
        next(err)
    }
}

export { chatCreateController, chatReadController, chatUpdateController, chatDeleteController }