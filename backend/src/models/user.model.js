import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    password: {
      type: String,
    },
    googleID: {
      type: String,
      index: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },

    verificationToken: {
      type: String,
      index: true,
    },
    verificationTokenExpiry: {
      type: Date,
    },
    resetToken: {
      type: String,
      index: true,
    },
    resetTokenExpiry: {
      type: Date,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "ai", "system", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.model("user", userSchema);

export default userModel;
