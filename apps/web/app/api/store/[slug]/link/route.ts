import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { departureKnown, departuresWithPhotos, galleryTeaser, privateGalleryUrl, sendPrivateInvite } from "@/lib/private-link";
import { GALLERIES_SUBJECT, sendYourGalleriesEmail } from "@/lib/email";
import { photosOf } from "@/lib/format";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

const MAX_LINKS = 5;

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  code: z.string().trim().toLowerCase().max(16).optional(),
});

/** Ce que l'écran dit au client. */
type LinkOutcome =
  /** Le lien personnel vient de partir. */
  | "sent"
  /** L'adresse est sur la liste, mais ses photos ne sont pas encore prêtes
   *  (sortie pas publiée, ou départ pas encore indiqué) : le lien partira seul. */
  | "pending"
  /** Aucune sortie ne correspond à cette adresse. */
  | "no_match";

/**
 * Recevoir le lien de sa galerie privée, comme sur la page d'une course chez
 * Finisher Memories : l'adresse e-mail joue le rôle du dossard. Elle doit
 * figurer sur la liste de la sortie donnée par le prestataire ; rien ne
 * s'inscrit ici. Comme chez eux, l'écran dit clairement si l'adresse ne
 * correspond à rien, pour que le client essaie celle de sa réservation.
 *  - avec le code du QR de fin de sortie : le lien de CETTE sortie ;
 *  - sans code (l'adresse de la boutique) : les liens des sorties publiées
 *    de ce prestataire où cette adresse figure.
 */
export async function POST(request: Request, { params }: { params: { slug: string } }): Promise<Response> {
  try {
    const ip = await checkRateLimit(`link:ip:${requestIp(request)}`, { max: 10, windowMs: 15 * 60 * 1000 });
    if (!ip.allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });
    const { email, code } = parsed.data;

    // Une même adresse ne reçoit pas plus de dix liens par heure.
    const perEmail = await checkRateLimit(`link:email:${email}`, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!perEmail.allowed) return Response.json({ error: "rate_limited" }, { status: 429 });

    const reply = (outcome: LinkOutcome, subject?: string) => Response.json({ outcome, ...(subject ? { subject } : {}) });

    const operator = await prisma.operator.findUnique({ where: { slug: params.slug.trim().toLowerCase() }, select: { id: true } });
    if (!operator) return reply("no_match");

    if (code) {
      const sortie = await prisma.sortie.findFirst({
        where: { operatorId: operator.id, shareCode: code, mode: "GROUPE" },
        include: { operator: true },
      });
      if (!sortie) return reply("no_match");

      const participant = await prisma.participant.findFirst({
        where: { sortieId: sortie.id, contact: { equals: email, mode: "insensitive" }, deletedAt: null },
        select: { id: true, token: true, contact: true, slotId: true },
      });
      if (!participant) {
        await track("gallery_link_requested", { operatorId: operator.id, meta: { via: "qr", outcome: "no_match" } });
        return reply("no_match");
      }

      const ready = sortie.status === "SENT" && departureKnown(participant, (await departuresWithPhotos(sortie.id)).length);
      if (ready) await sendPrivateInvite(participant, sortie);
      const outcome: LinkOutcome = ready ? "sent" : "pending";
      await track("gallery_link_requested", { operatorId: operator.id, participantId: participant.id, meta: { via: "qr", outcome } });
      return reply(outcome);
    }

    const participants = await prisma.participant.findMany({
      where: {
        contact: { equals: email, mode: "insensitive" },
        deletedAt: null,
        sortie: { operatorId: operator.id },
      },
      include: { sortie: { include: { operator: true } } },
      orderBy: { sortie: { startsAt: "desc" } },
      take: MAX_LINKS,
    });
    const ready: typeof participants = [];
    for (const participant of participants) {
      if (participant.sortie.status !== "SENT") continue;
      if (participant.sortie.mode === "GROUPE" && !departureKnown(participant, (await departuresWithPhotos(participant.sortieId)).length)) continue;
      ready.push(participant);
    }

    // Une seule galerie : le mail habituel. Plusieurs : un seul mail qui les
    // liste toutes, plutôt qu'un mail par sortie.
    let sent = 0;
    let subject: string | undefined;
    try {
      if (ready.length === 1) {
        const only = ready[0]!;
        await sendPrivateInvite(only, only.sortie);
        sent = 1;
        subject = `Vos photos ${photosOf(only.sortie.activity)} du ${only.sortie.startsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })}`;
      } else if (ready.length > 1) {
        const op = ready[0]!.sortie.operator;
        await sendYourGalleriesEmail({
          to: email,
          operatorId: op.id,
          operatorName: op.name,
          operatorLogoUrl: op.logoUrl,
          brandColor: op.brandColor,
          heroUrl: op.coverUrl,
          galleries: await Promise.all(
            ready.map(async (p) => {
              const teaser = await galleryTeaser({ id: p.id, sortieId: p.sortieId, slotId: p.slotId });
              return {
                activity: p.sortie.activity,
                date: p.sortie.startsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" }),
                detail: teaser.detail ?? undefined,
                photoCount: teaser.photoCount,
                thumb: teaser.thumbs[0],
                url: privateGalleryUrl(p.token),
              };
            }),
          ),
        });
        sent = ready.length;
        subject = `${GALLERIES_SUBJECT} chez ${op.name}`;
        const now = new Date();
        await prisma.participant.updateMany({ where: { id: { in: ready.filter((p) => !p.sentAt).map((p) => p.id) } }, data: { sentAt: now } });
      }
    } catch (error) {
      console.error("[API /api/store/[slug]/link] send failed for", email, error);
      return Response.json({ error: "send_failed" }, { status: 502 });
    }
    const outcome: LinkOutcome = sent > 0 ? "sent" : participants.length > 0 ? "pending" : "no_match";
    await track("gallery_link_requested", { operatorId: operator.id, meta: { via: "store", outcome, found: participants.length } });
    return reply(outcome, subject);
  } catch (error) {
    console.error("[API /api/store/[slug]/link]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
