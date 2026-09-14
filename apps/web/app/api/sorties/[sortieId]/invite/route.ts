import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { sendGroupInviteEmail } from "@/lib/email";
import { deriveChannel } from "@/lib/channel";
import { nameFromEmail } from "@/lib/emails";
import { ensureShareCode, storeUrl } from "@/lib/store";

const DAY_MS = 24 * 60 * 60 * 1000;

// Jusqu'à 200 envois Resend à la suite : la durée par défaut ne suffit pas.
export const maxDuration = 60;

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
});

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

/**
 * Envoyer le lien de la boutique à une liste d'adresses (mode GROUPE).
 *
 * Chaque adresse devient un Participant, marqué `sentAt` : c'est ce qui la
 * fait apparaître dans « Vos clients » avec l'état « Envoyé ». Avant, l'envoi
 * ne laissait aucune trace et l'opérateur ne savait plus à qui il avait écrit.
 * La ligne existe donc avant l'achat, et le paiement la reprend au lieu d'en
 * créer une seconde (cf. api/store/[slug]/slots/[slotId]/checkout).
 *
 * Réenvoyer à une adresse déjà présente ne la duplique pas.
 */
export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: { operator: true },
    });
    if (!sortie || sortie.mode !== "GROUPE") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const code = await ensureShareCode(sortie);
    const galleryUrl = storeUrl(sortie.operator.slug, code);
    const emails = Array.from(new Set(parsed.data.emails.map((e) => e.trim().toLowerCase())));

    const now = new Date();
    let sent = 0;
    for (const to of emails) {
      try {
        // Une ligne par adresse, réutilisée si elle existe déjà : l'opérateur
        // qui renvoie à toute sa liste ne doit pas la voir doubler.
        const existing = await prisma.participant.findFirst({
          where: { sortieId: sortie.id, contact: { equals: to, mode: "insensitive" }, deletedAt: null },
          select: { id: true },
        });
        const participant =
          existing ??
          (await prisma.participant.create({
            data: {
              sortieId: sortie.id,
              name: nameFromEmail(to),
              contact: to,
              channel: deriveChannel(to),
              token: crypto.randomUUID(),
              consentAt: now,
              deleteAt: new Date(now.getTime() + 90 * DAY_MS),
            },
            select: { id: true },
          }));

        await sendGroupInviteEmail({
          to,
          operatorId: sortie.operatorId,
          operatorName: sortie.operator.name,
          operatorLogoUrl: sortie.operator.logoUrl,
          brandColor: sortie.operator.brandColor,
          activity: sortie.activity,
          sortieDate: formatDateFr(sortie.startsAt),
          sortiePlace: sortie.place,
          galleryUrl,
        });
        // La date d'envoi n'est posée qu'après l'envoi : une ligne sans
        // `sentAt` est une adresse à qui l'email n'est jamais parti.
        await prisma.participant.update({ where: { id: participant.id }, data: { sentAt: now } });
        sent += 1;
      } catch (error) {
        console.error("[API /api/sorties/[sortieId]/invite] send failed for", to, error);
      }
    }

    await track("group_invite_sent", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, sent, total: emails.length } });

    return Response.json({ sent, total: emails.length }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/invite]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
