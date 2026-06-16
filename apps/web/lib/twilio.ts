import twilio from "twilio";
import { env } from "./env";

export const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  await twilioClient.messages.create({
    from: env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${to}`,
    body,
  });
}

export async function sendSms(to: string, body: string): Promise<void> {
  if (!env.TWILIO_SMS_FROM) {
    throw new Error("TWILIO_SMS_FROM is not configured");
  }
  await twilioClient.messages.create({
    from: env.TWILIO_SMS_FROM,
    to,
    body,
  });
}
