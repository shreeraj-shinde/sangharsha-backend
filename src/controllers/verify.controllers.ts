import { Request, Response } from "express";
import { sendOtpService, verifyOtpService } from "../services/verify.service";

export const sendOtpController = (
  req: Request,
  res: Response,
): Promise<Response> => sendOtpService(req, res);

export const verifyOtpController = (
  req: Request,
  res: Response,
): Promise<Response> => verifyOtpService(req, res);
