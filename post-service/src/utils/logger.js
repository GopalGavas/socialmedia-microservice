import winston, { format, transports } from "winston";

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.errors({ stack: true }),
    format.splat()
  ),
  defaultMeta: { service: "post-service" },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),

    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log", level: "info" }),
  ],
});
