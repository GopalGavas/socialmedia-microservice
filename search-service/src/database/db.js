import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}`
    );
    logger.info(
      `MongoDB connection Successfull! MongoDB connected at host:${connectionInstance.connection.host}.Connected to Database: ${connectionInstance.connection.name}`
    );
  } catch (error) {
    logger.error(`MongoDB connection error:  ${error}`);
  }
};
