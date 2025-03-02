import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { app } from "./app.js";
import { connectDB } from "./database/db.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import { logger } from "./utils/logger.js";
import { ApiError } from "./utils/apiError.js";
import { handleSearchPost } from "./event/searchEventHandler.js";

const startServer = async () => {
  try {
    // "Connect to MongoDB"
    await connectDB();
    logger.info("Connected to MongoDB");

    const channel = await connectToRabbitMQ();
    if (!channel) {
      throw new ApiError(500, "Failed to connect to RabbitMq ");
    }

    await consumeEvent("post.created", handleSearchPost);

    app.on("error", (error) => {
      logger.error("Error: ", error);
    });

    const PORT = process.env.PORT || 8004;
    app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Startup Error:", error);
    process.exit(1);
  }
};

startServer();
