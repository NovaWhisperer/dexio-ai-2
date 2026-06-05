import mongoose from "mongoose";

const userAnalyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },
    chatCount: {
      type: Number,
      required: true,
      default: 0,
    },
    messageCount: {
      type: Number,
      required: true,
      default: 0,
    },
    lastActiveAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

const userAnalyticsModel = mongoose.model("userAnalytics", userAnalyticsSchema);

export default userAnalyticsModel;
