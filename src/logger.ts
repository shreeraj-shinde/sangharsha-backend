import winston from "winston";

const logLevel = process.env.NODE_ENV === "production" ? "info" : "debug";
const symbol = logLevel === "info" ? "ℹ️" : logLevel === "debug" ? "⚙️" : "🏠";

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.json(),
  defaultMeta: { service: "user-service" },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize({ message: true }),
        winston.format.printf((info) => {
          return `${info.timestamp} [${info.level}] ${symbol}  ${info.message}`;
        }),
      ),
    }),
  ],
});

export default logger;
