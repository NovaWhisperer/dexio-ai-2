import app from "./src/app.js"

import { PORT } from "./config/index.js"
import { logger } from "./src/utils/logger.js"

app.listen(PORT, () => {
    logger.info("Server is listenning on PORT", {port: PORT})
})
