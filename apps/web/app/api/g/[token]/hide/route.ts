import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";
import { sendPhotoWithdrawalNotifiedEmail } from "@/lib/email";
import { visiblePhotoWhere } from "@/lib/access";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

const schema = z.object({ photoId: z.string().min(1) });

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });
}

/**
 * Retrait d'une photo, sans justification (brief §5.3). Masquage immédiat,
 * pour tout le monde. Seule une photo que ce lien montre peut être retirée :
 * celles de son départ, ou les siennes et les communes en sortie
 * individuelle. Le plafond de débit reste, un lien transféré pouvant finir
 * entre de mauvaises mains.
 */
export async function POST(request: Request, { params }: { params: { token: string } }): Promise<Response> {
  try {
    const { allowed } = await checkRateLimit(`hide:ip:${requestIp(request)}`, { max: 20, windowMs: 15 * 60 * 1000 });
    if (!allowed) return Response.json({ error: "Trop de demandes, réessayez dans quelques minutes." }, { status: 429 });

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "invalid" }, { status: 400 });

    const participant = await prisma.participant.findUnique({
      where: { token: params.token },
      select: { id: true, sortieId: true, slotId: true, deletedAt: true, sortie: { include: { operator: { select: { id: true, name: true } } } } },
    });
    if (!participant || participant.deletedAt) return Response.json({ error: "not_found" }, { status: 404 });
    if (participant.sortie.mode === "GROUPE" && !participant.slotId) return Response.json({ error: "not_found" }, { status: 404 });

    const photo = await prisma.photo.findFirst({
      where: { ...visiblePhotoWhere(participant), id: parsed.data.photoId },
      include: { slot: true },
    });
    if (!photo) return Response.json({ error: "not_found" }, { status: 404 });

    await prisma.photo.update({ where: { id: photo.id }, data: { hiddenAt: new Date() } });
    const operator = participant.sortie.operator;
    await track("photo_hidden", { operatorId: operator.id, participantId: participant.id, meta: { photoId: photo.id, sortieId: photo.sortieId } });

    try {
      await sendPhotoWithdrawalNotifiedEmail({
        operatorId: operator.id,
        operatorName: operator.name,
        activity: participant.sortie.activity,
        sortieDate: formatDateFr(participant.sortie.startsAt),
        slotLabel: photo.slot?.label ?? "-",
        galleryUrl: `${env.NEXT_PUBLIC_APP_URL}/sorties/${photo.sortieId}`,
      });
    } catch (error) {
      // Le masquage a eu lieu : une notification manquée ne doit pas faire
      // croire au client que son retrait n'a pas marché.
      console.error("[API /api/g/[token]/hide] notification email failed", error);
    }

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[API /api/g/[token]/hide]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
