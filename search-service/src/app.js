import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { logger } from "./utils/logger.js";
import { redisClient } from "./database/redisClient.js";

const app = express();

// "Security middlewares"
app.use(cors());
app.use(helmet());

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
