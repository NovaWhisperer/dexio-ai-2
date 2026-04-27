import { config } from "dotenv";

config()

const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI
const NODE_ENV = process.env.NODE_ENV

export { PORT, MONGO_URI, NODE_ENV } 