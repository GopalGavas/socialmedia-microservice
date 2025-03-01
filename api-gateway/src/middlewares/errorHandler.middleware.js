import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, next) => {
  logger.error(
    `${err.statusCode || 500} ${err.message || "Intenral server error"} ${
      err.stack || "stack does not exists"
    }`
  );

  return res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server error",
  });
};
