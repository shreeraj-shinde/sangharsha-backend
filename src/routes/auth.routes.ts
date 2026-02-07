import { Router } from "express";
import logger from "../logger";
import AuthController from "../controllers/auth.controllers";

const authRouter = Router();

authRouter.post("/auth/signup", (req, res) => {
  logger.info(`POST /auth/signup ${res.statusCode}`);
  AuthController.register(req, res);
});

authRouter.post("/auth/login", (req, res) => {
  logger.info(`POST /auth/login ${res.statusCode}`);
  AuthController.login(req, res);
});

export default authRouter;
