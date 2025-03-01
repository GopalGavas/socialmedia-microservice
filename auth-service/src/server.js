import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import { app } from "./app.js";
import { connectDB } from "./database/db.js";
import { logger } from "./utils/logger.js";

connectDB()
  .then(() => {
    logger.info("Connected to MongoDB");
    app.on("error", (error) => {
      console.log("Error: ", error);
    });

    const PORT = process.env.PORT || 8001;
    app.listen(PORT, () => {
      logger.info(`Identity service running on port ${PORT}`);
      console.log(`Server is listening on PORT ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error("Mongo Connection error: ", error);
    console.log(`MongoDB connection Error: ${error}`);
  });
