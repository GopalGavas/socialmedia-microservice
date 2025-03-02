import { redisClient } from "../database/redisClient.js";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { RedisStore } from "rate-limit-redis";
import { rateLimit } from "express-rate-limit";
import { logger } from "../utils/logger.js";

export const globalRateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

export const rateLimitingForFullTextSearch = rateLimit({
  windowMs: 1 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Search endpoint rate limit exceeded for IP: ${req.ip}`);
    res
      .status(429)
      .json({ success: false, message: "Too many delete requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});
