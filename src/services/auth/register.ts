import { z } from "zod";
import prisma from "../../prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import logger from "../../logger";

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(6),
  countryCode: z.string(),
  phone: z.string(),
  confirmPassword: z.string(),
});

/**
 * Handles user registration.
 *
 * @param req - The request object containing user details in the body.
 * @param res - The response object used to send the response.
 * @returns A promise that resolves to the response object.
 */
const registerService = async (req: Request, res: Response) => {
  try {
    //Validate Body
    const validate = registerSchema.safeParse({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      countryCode: req.body.countryCode,
      phone: req.body.phone,
      confirmPassword: req.body.confirmPassword,
    });

    //Validation Failed
    if (!validate.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
      });
    }

    logger.debug("[Register Service] Validation Passed");

    const passwordMatch =
      validate.data.password === validate.data.confirmPassword;
    //Password Not Matched
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }
    logger.debug("[Register Service] Password Matched");

    // Get User
    const user = await prisma.user.findUnique({
      where: { email: validate.data.email },
    });

    // User Already Exists
    if (user) {
      logger.error("[Register Service] User Already Exists");
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(validate.data.password, 10);

    // Create User
    const newUser = await prisma.user.create({
      data: {
        name: validate.data.name,
        email: validate.data.email,
        password: hashedPassword,
        countryCode: validate.data.countryCode,
        phone: validate.data.phone,
      },
    });
    logger.debug("[Register Service] User Created");

    // Generate JWT
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    // Generate Token
    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );

    // Set Cookie
    return res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24 * 7,
      })
      .json({
        success: true,
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
  } catch (error) {
    //Return Error
    logger.error("[Register Service] Internal Server Error");
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error,
    });
  }
};

export default registerService;
