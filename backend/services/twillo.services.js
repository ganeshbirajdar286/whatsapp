import twilio from "twilio";
import dotenv from "dotenv";
dotenv.config();

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

// -------------------------
//  SEND OTP
// -------------------------
export const senOtpToPhoneNumber = async (phoneNumber) => {
  try {
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log("OTP Sent:", response);
    return { success: true, message: "OTP sent successfully", response };
  } catch (error) {
    console.log("Failed to send OTP:", error.message);
    return { success: false, message: error.message };
  }
};

// -------------------------
//  VERIFY OTP
// -------------------------
export const verifyOtp = async (phoneNumber, otp) => {
  try {
    if (!phoneNumber || !otp) {
      throw new Error("Phone number and OTP are required");
    }

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp, // IMPORTANT: correct variable
      });

    console.log("OTP Verify Response:", response);

    if (response.status === "approved") {
      return { success: true, message: "OTP verified successfully" };
    } else {
      return { success: false, message: "Invalid or expired OTP" };
    }
  } catch (error) {
    console.log("Failed to verify OTP:", error.message);
    return { success: false, message: error.message };
  } 
};
