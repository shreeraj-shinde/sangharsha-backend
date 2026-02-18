import "dotenv/config";
import express, { Request, Response } from "express";
import router from "./routes/routes";
import logger from "./logger";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
const port = process.env.PORT || 3001;
const instanceId = Math.random().toString(36).substring(7);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(cookieParser());

//Use Router
app.use("/", router);

// Error handling for the server
process.on("uncaughtException", (err) => {
  logger.error(`[${instanceId}] Uncaught Exception: ${err.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    `[${instanceId}] Unhandled Rejection at: ${promise}, reason: ${reason}`,
  );
  process.exit(1);
});

const server = require("http").createServer(app);

server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`[${instanceId}] Port ${port} is already in use.`);
  } else {
    logger.error(`[${instanceId}] Server error: ${error.message}`);
  }
  process.exit(1);
});

server.listen(port, () => {
  logger.info(`[${instanceId}] ⚙️  Server is running on port ${port}`);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info(`[${instanceId}] Closing server...`);
  server.close(() => {
    logger.info(`[${instanceId}] Server closed.`);
    process.exit(0);
  });
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Handle nodemon restarts
process.once("SIGUSR2", () => {
  logger.info(`[${instanceId}] Nodemon restart signal received. Closing...`);
  server.close(() => {
    process.kill(process.pid, "SIGUSR2");
  });
});
