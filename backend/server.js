import app from "./src/app.js"
import { PORT } from "./config/index.js"
import { logger } from "./src/utils/logger.js"
import connectDB from "./src/db/db.js"

process.on("uncaughtException", (err, origin) => {
    logger.error(err)
    process.exit(1)
})

process.on("unhandledRejection", (reason, promise) => {
    logger.error(reason)
    process.exit(1)
})

const startApplication = async (params) => {
    await connectDB()

    app.listen(PORT, () => {
        logger.info("Server is listenning on PORT", { port: PORT })
    })
}
startApplication()


