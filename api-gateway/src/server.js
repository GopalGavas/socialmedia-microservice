import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { RedisStore } from "rate-limit-redis";
import Redis from "ioredis";
import { rateLimit } from "express-rate-limit";
import proxy from "express-http-proxy";
import { validateToken } from "./middlewares/auth.middleware.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();
const PORT = process.env.PORT || 8000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// rateLimiting
const ratelimiting = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use(ratelimiting);

app.use((req, _, next) => {
  logger.info(`Recieved ${req.method} from ${req.url}`);
  logger.info(`Request body: ${req.body}`);
  next();
});

// [proxy options]
const proxyOptions = {
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);

    return res.status(500).json({
      message: `Internal server error` || err.message,
      error: Array.isArray(err.details) ? err.details[0] : null,
    });
  },
};

// [setting up proxy for identity service]
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Identity service ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

// [setting up proxy for post service]
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POST_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response recieved from Post service ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// [setting up proxy for media service]
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response recieved from Post service ${proxyRes.statusCode}`);
      return proxyResData;
    },
    parseReqBody: false,
  })
);

// [setting up proxy for search service]
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.SEARCH_SERVICE, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user._id;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(
        `Response recieved from Search service ${proxyRes.statusCode}`
      );
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Api Gateway is running on port: ${PORT}`);
  logger.info(
    `Identity Service is running on port: ${process.env.IDENTITY_SERVICE}`
  );
  logger.info(`Post Service is running on port: ${process.env.POST_SERVICE}`);
  logger.info(`Media Service is running on port: ${process.env.MEDIA_SERVICE}`);
  logger.info(
    `Search Service is running on port: ${process.env.SEARCH_SERVICE}`
  );
  logger.info(`Redis Url: ${process.env.REDIS_URL}`);
});

// 'apigateway -> /v1/auth/register -> localhost:8000'
// 'authservice -> /api/auth/register -> localhost:8001'
// "localhost:8000/v1/auth/register ->  localhost:8001/api/auth/register"
