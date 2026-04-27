import winston from "winston";
import { NODE_ENV } from "../../config/index.js";

let setLevel = (NODE_ENV === "development") ? "http" : "info"

const logger = winston.createLogger({
    level: setLevel,
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: "logs/error.log", level: "error"
        }),

        new winston.transports.File({
            filename: "logs/combined.log"
        })
    ]
})

if (NODE_ENV !== "production") {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }))
}



export { logger }