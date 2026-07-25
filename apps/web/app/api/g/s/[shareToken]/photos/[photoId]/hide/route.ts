import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";
import { sendPhotoWithdrawalNotifiedEmail } from "@/lib/email";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Public, non authentifié — c'est le principe même du retrait "sans
// justification" (brief §5.3) : le shareToken suffit, aucune preuve d'achat
// ni d'identité n'est demandée. Masquage immédiat, avant même traitement.
export async function POST(_request: Request, { params }: { params: { shareToken: string; photoId: string } }): Promise<Response> {
  try {
    const operator = await prisma.operator.findUnique({ where: { shareToken: params.shareToken } });
    if (!operator) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortie: { operatorId: operator.id, mode: "GROUPE" } },
      include: { slot: true, sortie: true },
    });
    if (!photo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.photo.update({ where: { id: photo.id }, data: { hiddenAt: new Date() } });
    await track("photo_hidden", { operatorId: operator.id, meta: { photoId: photo.id, sortieId: photo.sortieId } });

    try {
      await sendPhotoWithdrawalNotifiedEmail({
        operatorId: operator.id,
        operatorName: operator.name,
        activity: photo.sortie.activity,
        sortieDate: formatDateFr(photo.sortie.startsAt),
        slotLabel: photo.slot?.label ?? "—",
        galleryUrl: `${env.NEXT_PUBLIC_APP_URL}/sorties/${photo.sortieId}`,
      });
    } catch (error) {
      // Le masquage a déjà eu lieu — une notification manquée ne doit jamais
      // faire échouer la requête ni redonner l'impression que le retrait n'a pas marché.
      console.error("[API /api/g/s/[shareToken]/photos/[photoId]/hide] notification email failed", error);
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/g/s/[shareToken]/photos/[photoId]/hide]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
