import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(
    `${err.statusCode || 500} - ${err.message} - ${
      err.stack || "No stack trace"
    }`
  );

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};
