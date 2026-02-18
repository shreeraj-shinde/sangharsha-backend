import { Router } from "express";
import logger from "../logger";
import {
  sendOtpController,
  verifyOtpController,
} from "../controllers/verify.controllers";

const verifyRouter = Router();

verifyRouter.post("/verify/send-otp", (req, res) => {
  logger.info("POST /verify/send-otp");
  sendOtpController(req, res);
});

verifyRouter.post("/verify/check-otp", (req, res) => {
  logger.info("POST /verify/check-otp");
  verifyOtpController(req, res);
});

export default verifyRouter;
