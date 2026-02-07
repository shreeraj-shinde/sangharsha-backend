import "dotenv/config";
import express, { Request, Response } from "express";
import router from "./routes/routes";
import logger from "./logger";
import cookieParser from "cookie-parser";

const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use(cookieParser());

//Use Router
app.use("/", router);

app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});
