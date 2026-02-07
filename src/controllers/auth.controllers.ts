import { Request, Response } from "express";
import registerService from "../services/auth/register";
import loginService from "../services/auth/login";
import { APIResponse } from "../types/constants";

class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    registerService(req, res);
  }

  async login(req: Request, res: Response): Promise<void> {
    loginService(req, res);
  }
}

export default new AuthController();
