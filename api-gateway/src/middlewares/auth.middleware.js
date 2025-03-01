import jwt from "jsonwebtoken";
import { logger } from "../utils/logger.js";

export const validateToken = (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    logger.warn("Access attempt without valid token");
    return res.status(401).json({
      message: "Authentication required",
      success: false,
    });
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, user) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        logger.warn("Token expired");
        return res.status(401).json({
          message: "Token expired, please log in again",
          success: false,
        });
      }

      logger.warn("Invalid token");
      return res.status(401).json({
        message: "Invalid token",
        success: false,
      });
    }

    req.user = user;
    next();
  });
};
