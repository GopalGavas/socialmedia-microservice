import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { logger } from "./utils/logger.js";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

const app = express();

const redisClient = new Redis(process.env.REDIS_URL);

// "middlewares"
app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// "security middlewares"
app.use(helmet());
app.use(cors());

app.use((req, _, next) => {
  logger.info(`Received ${req.method} from request to ${req.url}`);
  logger.info(`Req Body: ${req.body}`);
  next();
});

// "DDos Protection and rate limiting"
const ratelimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: "middleware",
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  ratelimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limiting exceded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

// "rate limiting for sensitive routes"
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for ip: ${req.ip}`);
    res.status(429).json({ success: false, message: "Too many requests" });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

// "Apply this sensitiveEndpointsLimiter to our routes"
app.use("/api/auth/register", sensitiveEndpointsLimiter);
app.use("/api/auth/login", sensitiveEndpointsLimiter);

// "ROUTES"
import authRouter from "./routes/auth.routes.js";

app.use("/api/auth", authRouter);

// "Error middleware"
app.use(errorHandler);

export { app };
