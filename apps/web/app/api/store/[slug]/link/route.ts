import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { nameFromEmail } from "@/lib/emails";
import { sendPrivateInvite } from "@/lib/private-link";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_LINKS = 5;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  code: z.string().trim().toLowerCase().max(16).optional(),
});

/**
 * Recevoir le lien de sa galerie privée. Deux portes :
 *  - avec le code du QR de fin de sortie, l'adresse devient un client de
 *    cette sortie ; son lien part tout de suite si les photos sont en ligne,
 *    sinon à la publication (lib/private-link.ts, sendPendingInvites) ;
 *  - sans code (l'adresse de la boutique), on renvoie les liens des sorties
 *    publiées de ce prestataire où cette adresse figure déjà.
 * La réponse est toujours la même : elle ne dit pas si l'adresse est connue.
 */
export async function POST(request: Request, { params }: { params: { slug: string } }): Promise<Response> {
  try {
    const ip = await checkRateLimit(`link:ip:${requestIp(request)}`, { max: 10, windowMs: 15 * 60 * 1000 });
    if (!ip.allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
    const { email, code } = parsed.data;

    // Une adresse ne reçoit pas plus de quelques e-mails par heure, quelle que
    // soit la machine qui les demande.
    const perEmail = await checkRateLimit(`link:email:${email}`, { max: 4, windowMs: 60 * 60 * 1000 });
    if (!perEmail.allowed) return Response.json({ ok: true });

    const operator = await prisma.operator.findUnique({ where: { slug: params.slug.trim().toLowerCase() }, select: { id: true } });
    if (!operator) return Response.json({ ok: true });

    if (code) {
      const sortie = await prisma.sortie.findFirst({
        where: { operatorId: operator.id, shareCode: code, mode: "GROUPE" },
        include: { operator: true },
      });
      if (!sortie) return Response.json({ ok: true });

      const now = new Date();
      const participant =
        (await prisma.participant.findFirst({
          where: { sortieId: sortie.id, contact: { equals: email, mode: "insensitive" }, deletedAt: null },
          select: { id: true, token: true, contact: true },
        })) ??
        (await prisma.participant.create({
          data: {
            sortieId: sortie.id,
            name: nameFromEmail(email),
            contact: email,
            channel: "EMAIL",
            token: crypto.randomUUID(),
            consentAt: now,
            deleteAt: new Date(now.getTime() + 90 * DAY_MS),
          },
          select: { id: true, token: true, contact: true },
        }));

      if (sortie.status === "SENT") await sendPrivateInvite(participant, sortie);
      await track("gallery_link_requested", { operatorId: operator.id, participantId: participant.id, meta: { via: "qr", published: sortie.status === "SENT" } });
      return Response.json({ ok: true });
    }

    const participants = await prisma.participant.findMany({
      where: {
        contact: { equals: email, mode: "insensitive" },
        deletedAt: null,
        sortie: { operatorId: operator.id, status: "SENT" },
      },
      include: { sortie: { include: { operator: true } } },
      orderBy: { createdAt: "desc" },
      take: MAX_LINKS,
    });
    for (const participant of participants) {
      try {
        await sendPrivateInvite(participant, participant.sortie);
      } catch (error) {
        console.error("[API /api/store/[slug]/link] send failed for", participant.id, error);
      }
    }
    await track("gallery_link_requested", { operatorId: operator.id, meta: { via: "store", found: participants.length } });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[API /api/store/[slug]/link]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
