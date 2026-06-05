import { createClient } from "redis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "../../config/index.js";
import { logger } from "../utils/logger.js";

const client = createClient({
  username: "default",
  password: REDIS_PASSWORD,
  socket: {
    host: REDIS_HOST,
    port: REDIS_PORT,
  },
});

client.on("error", (err) => logger.error("Redis Client Error", err));

async function connectRedis() {
  try {
    await client.connect();
    logger.info("Connected to Redis DB");
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

export { client, connectRedis };
