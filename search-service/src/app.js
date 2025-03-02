import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { logger } from "./utils/logger.js";
import { redisClient } from "./database/redisClient.js";
import { globalRateLimiter } from "./middlewares/rateLimiter.middleware.js";

const app = express();

// "Security middlewares"
app.use(cors());
app.use(helmet());

app.use((req, res, next) => {
  globalRateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limiting exceded for ip: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    });
});

app.use((req, _, next) => {
  logger.info(`Recieved ${req.method} from request to  ${req.url}`);
  logger.info(`Req Body: ${req.body}`);
  next();
});

// "Middlewares"
app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));

// "routes ->  pass redis client to routes"
import searchRouter from "./routes/search.routes.js";

app.use(
  "/api/search",
  (req, _, next) => {
    req.redisClient = redisClient;
    next();
  },
  searchRouter
);

// "errorhandler middleware"
app.use(errorHandler);

export { app };
