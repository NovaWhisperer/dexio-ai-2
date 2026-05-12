import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        index:true
    },
    chatName: {
        type: String,
        required: true,
        default: "New Chat"
    }
}, {
    timestamps: true
})

const chatModel = mongoose.model("chat",chatSchema)

export default chatModel