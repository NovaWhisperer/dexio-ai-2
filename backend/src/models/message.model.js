import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat',
        required: true,
        index: true
    },
    messageContent: {
        type: String,
        required: true,

    },
    role: {
        type: String,
        enum: ["user", "ai"],
        required: true,
        default: "user"
    }
}, {
    timestamps: true
})

const messageModel = mongoose.model("message", messageSchema)

export default messageModel