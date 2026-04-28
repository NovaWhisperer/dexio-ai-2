import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fullName: {
        firstName: {
            type: String,
            required: true
        },
        lastName: {
            type: String,
            required: true
        }
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    googleID: {
        type: String,
    },
    verified: {
        type: Boolean,
        default: false
    },

    verificationToken: {
        type: String,

    },
    verificationTokenExpiry: {
        type: Date,

    },
    resetToken: {
        type: String,
    },
    resetTokenExpiry: {
        type: Date,
    },
    role: {
        type: String,
        required: true,
        enum: ["user", "ai", "system"],
        default: "user"
    }
}, {
    timestamps: true
})

const userModel =  mongoose.model("user", userSchema)

export default userModel