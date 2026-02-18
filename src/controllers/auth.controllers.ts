import { Request, Response } from "express";
import registerService from "../services/auth/register";
import loginService from "../services/auth/login";

const registerController = (req: Request, res: Response) =>
  registerService(req, res);
const loginController = (req: Request, res: Response) => loginService(req, res);

export { registerController, loginController };
