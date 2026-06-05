import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), { dbName: "verifyMASTER" });
};

export const clear = async () => {
  await mongoose.connection.dropDatabase();
};

export const disconnect = async () => {
  await mongoServer.stop();
  await mongoose.disconnect();
};
