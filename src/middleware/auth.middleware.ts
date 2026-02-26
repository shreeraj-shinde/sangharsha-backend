import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import logger from "../logger";

export interface AuthenticatedRequest extends Request {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export const authenticate = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.cookies.token;

  logger.debug(`[Auth Middleware] Request: ${req.method} ${req.originalUrl}`);
  logger.debug(`[Auth Middleware] Raw Cookies: ${req.headers.cookie}`);

  if (!token) {
    logger.warn("[Auth Middleware] No token found in cookies");
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error("[Auth Middleware] JWT_SECRET is not defined");
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }

    const decoded = jwt.verify(token, secret) as any;

    logger.debug(
      `[Auth Middleware] Token successfully verified for ID: ${decoded.id}`,
    );

    req.id = decoded.id;
    req.name = decoded.name;
    req.email = decoded.email;
    req.role = decoded.role;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      const decoded = jwt.decode(token) as any;
      logger.warn(
        `[Auth Middleware] Token expired. iat: ${decoded?.iat}, exp: ${decoded?.exp}, current: ${Math.floor(Date.now() / 1000)}`,
      );
    } else {
      logger.warn(`[Auth Middleware] Invalid token: ${error}`);
    }
    return res.status(401).json({
      success: false,
      message: "Unauthorized: Invalid token",
    });
  }
};
