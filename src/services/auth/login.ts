import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../prisma";
import { Request, Response } from "express";
import logger from "../../logger";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

/**
 * Handles user login.
 *
 * @param req - The request object containing email and password in the body.
 * @param res - The response object used to send the response.
 * @returns A promise that resolves to the response object.
 *
 */

const loginService = async (req: Request, res: Response) => {
  try {
    // Validate Body
    const validate = loginSchema.safeParse({
      email: req.body.email,
      password: req.body.password,
    });

    //Validation Failed
    if (!validate.success) {
      logger.warn(
        `[Login Service] Validation failed for email: ${req.body.email}`,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    logger.debug(
      `[Login Service] Attempting login for: ${validate.data.email}`,
    );

    //Get User
    const user = await prisma.user.findUnique({
      where: { email: validate.data.email },
    });

    //User Not Found
    if (!user) {
      logger.warn(`[Login Service] User not found: ${validate.data.email}`);
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    //Password Not Matched
    const isPasswordValid = await bcrypt.compare(
      validate.data.password,
      user.password,
    );

    //Password Not Matched
    if (!isPasswordValid) {
      logger.warn(
        `[Login Service] Invalid password for: ${validate.data.email}`,
      );
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }

    logger.debug(
      `[Login Service] Password matched for: ${validate.data.email}`,
    );

    //Generate JWT
    if (!process.env.JWT_SECRET) {
      logger.error("[Login Service] JWT_SECRET is not defined");
      throw new Error("JWT_SECRET is not defined");
    }

    //Generate Token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const decoded = jwt.decode(token) as any;
    logger.debug(
      `[Login Service] Generated fresh token. iat: ${decoded?.iat}, exp: ${decoded?.exp}`,
    );

    //Set Cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info(
      `[Login Service] User logged in successfully: ${validate.data.email}`,
    );

    //Return Response
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error(`[Login Service] Internal server error: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export default loginService;
