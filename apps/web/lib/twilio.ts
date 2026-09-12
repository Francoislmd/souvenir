import twilio from "twilio";
import { env } from "./env";
import { toE164 } from "./phone";

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

/**
 * La normalisation E.164 se fait ICI, au seul endroit qui parle à Twilio, et
 * pas chez l'appelant : l'opérateur saisit le numéro comme il le dit
 * (« 06 12 34 56 78 »), Twilio n'accepte que +33612345678. `toE164` existait
 * déjà mais n'était appelé nulle part — tout envoi WhatsApp vers un numéro
 * saisi au format local échouait, et silencieusement : l'appelant se contente
 * d'un console.error et d'un `sent: false` que l'opérateur ne voit jamais.
 */
export async function sendWhatsAppMessage(to: string, body: string): Promise<void> {
  await twilioClient.messages.create({
    from: env.TWILIO_WHATSAPP_FROM,
    to: `whatsapp:${toE164(to)}`,
    body,
  });
}

