import { z } from "zod";
import { Request, Response } from "express";
import logger from "../logger";
import { sendVerificationCode, checkVerificationCode } from "./twilio.service";

const sendOtpSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

const verifyOtpSchema = z.object({
  countryCode: z.string().min(1, "Country code is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  code: z.string().length(6, "OTP must be exactly 6 digits"),
});

/**
 * Handles sending an OTP to the user's phone number.
 */
export const sendOtpService = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const validate = sendOtpSchema.safeParse(req.body);

  if (!validate.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: validate.error.flatten().fieldErrors,
    });
  }

  const { countryCode, phone } = validate.data;

  try {
    await sendVerificationCode(countryCode, phone);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    logger.error(`[Verify Service] Failed to send OTP: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
    });
  }
};

/**
 * Handles verifying the OTP entered by the user.
 */
export const verifyOtpService = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  const validate = verifyOtpSchema.safeParse(req.body);

  if (!validate.success) {
    return res.status(400).json({
      success: false,
      message: "Invalid input",
      errors: validate.error.flatten().fieldErrors,
    });
  }

  const { countryCode, phone, code } = validate.data;

  try {
    const isApproved = await checkVerificationCode(countryCode, phone, code);

    if (!isApproved) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Phone number verified successfully",
    });
  } catch (error) {
    logger.error(`[Verify Service] Failed to verify OTP: ${error}`);
    return res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
    });
  }
};
