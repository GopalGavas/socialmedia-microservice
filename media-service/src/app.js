import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";
import { logger } from "./utils/logger.js";

const app = express();

// "Security middlewares"
app.use(cors());
app.use(helmet());

app.use((req, _, next) => {
  logger.info(`Recieved ${req.method} from request to  ${req.url}`);
  logger.info(`Req Body: ${req.body}`);
  next();
});

// app.use((req, res, next) => {
//   rateLimiter
//     .consume(req.ip)
//     .then(() => next())
//     .catch(() => {
//       logger.warn(`Rate limiting exceded for ip: ${req.ip}`);
//       res.status(429).json({ success: false, message: "Too many requests" });
//     });
// });

// "Middlewares"
app.use(express.json({}));
app.use(express.urlencoded({ extended: true }));

import mediaRouter from "./routes/media.routes.js";

app.use("/api/media", mediaRouter);

// "errorhandler middleware"
app.use(errorHandler);

export { app };
