import twilio from "twilio";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppMessage } from "@/lib/twilio";
import { maybeSendReviewMessage } from "@/lib/reviews";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";

export const runtime = "nodejs";

const CODE_REGEX = /SOUV-?([A-Z0-9]{6})/i;

export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("X-Twilio-Signature");
  const url = `${env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`;
  const body = await request.text();
  const params = Object.fromEntries(new URLSearchParams(body));

  if (!signature || !twilio.validateRequest(env.TWILIO_AUTH_TOKEN, signature, url, params)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const from = (params.From ?? "").replace("whatsapp:", "");
  const text = params.Body ?? "";
  const match = CODE_REGEX.exec(text);

  if (!match) {
    await sendWhatsAppMessage(from, "Hmm, ce code ne correspond à rien. Vérifie avec ton moniteur 🙂");
    return new Response("OK", { status: 200 });
  }

  const code = match[1].toUpperCase();
  const delivery = await prisma.delivery.findUnique({
    where: { code },
    include: { session: { include: { operator: true } } },
  });

  if (!delivery) {
    await sendWhatsAppMessage(from, "Hmm, ce code ne correspond à rien. Vérifie avec ton moniteur 🙂");
    return new Response("OK", { status: 200 });
  }

  // Le claim a déjà eu lieu à l'ouverture de la galerie (scan direct) — ce message
  // est l'opt-in WhatsApp optionnel : il capte le numéro et ouvre la fenêtre 24h
  // pour le message d'avis, sans changer le statut de la livraison.
  const updated = await prisma.delivery.update({
    where: { id: delivery.id },
    data: { clientPhone: delivery.clientPhone ?? from, whatsappOptInAt: new Date() },
  });

  await track("wa_message_received", {
    operatorId: delivery.session.operatorId,
    deliveryId: delivery.id,
  });

  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${delivery.token}`;
  await sendWhatsAppMessage(from, `Voilà ta galerie, tu la retrouveras toujours ici 👇\n${galleryUrl}`);

  await maybeSendReviewMessage({ ...updated, session: delivery.session });

  return new Response("OK", { status: 200 });
}
