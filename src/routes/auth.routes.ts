import { Router } from "express";
import logger from "../logger";
import {
  registerController,
  loginController,
} from "../controllers/auth.controllers";

const authRouter = Router();

authRouter.post("/auth/signup", (req, res) => {
  logger.info(`POST /auth/signup`);
  registerController(req, res);
});

authRouter.post("/auth/login", (req, res) => {
  logger.info(`POST /auth/login`);
  loginController(req, res);
});

export default authRouter;
