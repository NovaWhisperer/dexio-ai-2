import mongoose from "mongoose";
import { MONGO_URI } from "../../config/index.js";
import { logger } from "../utils/logger.js";

async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI)
        logger.info("Connected to MONGO DB")
    } catch (error) {
        logger.error(error)
        process.exit(1)
    }
}

export default connectDB
