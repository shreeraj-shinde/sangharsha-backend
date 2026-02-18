import twilio from "twilio";
import logger from "../logger";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

if (!accountSid || !authToken || !serviceSid) {
  throw new Error(
    "Missing Twilio credentials: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID must be set.",
  );
}

const client = twilio(accountSid, authToken);

/**
 * Sends a verification OTP to the given phone number via SMS.
 *
 * @param countryCode - The country dialing code (e.g. "+91")
 * @param phone - The local phone number (e.g. "9876543210")
 * @returns The Twilio verification object
 */
export const sendVerificationCode = async (
  countryCode: string,
  phone: string,
): Promise<void> => {
  const fullPhone = `${countryCode}${phone}`;
  logger.debug(`[Twilio Service] Sending OTP to ${fullPhone}`);

  await client.verify.v2
    .services(serviceSid)
    .verifications.create({ to: fullPhone, channel: "sms" });

  logger.info(`[Twilio Service] OTP sent to ${fullPhone}`);
};

/**
 * Checks the OTP entered by the user against Twilio.
 *
 * @param countryCode - The country dialing code (e.g. "+91")
 * @param phone - The local phone number (e.g. "9876543210")
 * @param code - The 6-digit OTP entered by the user
 * @returns true if the code is approved, false otherwise
 */
export const checkVerificationCode = async (
  countryCode: string,
  phone: string,
  code: string,
): Promise<boolean> => {
  const fullPhone = `${countryCode}${phone}`;
  logger.debug(`[Twilio Service] Checking OTP for ${fullPhone}`);

  const result = await client.verify.v2
    .services(serviceSid)
    .verificationChecks.create({ to: fullPhone, code });

  logger.info(`[Twilio Service] OTP check for ${fullPhone}: ${result.status}`);

  return result.status === "approved";
};
