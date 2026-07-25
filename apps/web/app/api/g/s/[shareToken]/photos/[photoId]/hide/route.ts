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
    const sortie = await prisma.sortie.findUnique({
      where: { shareToken: params.shareToken },
      include: { operator: true },
    });
    if (!sortie || sortie.mode !== "GROUPE") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const photo = await prisma.photo.findFirst({
      where: { id: params.photoId, sortieId: sortie.id },
      include: { slot: true },
    });
    if (!photo) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.photo.update({ where: { id: photo.id }, data: { hiddenAt: new Date() } });
    await track("photo_hidden", { operatorId: sortie.operatorId, meta: { photoId: photo.id, sortieId: sortie.id } });

    try {
      await sendPhotoWithdrawalNotifiedEmail({
        operatorId: sortie.operatorId,
        operatorName: sortie.operator.name,
        activity: sortie.activity,
        sortieDate: formatDateFr(sortie.startsAt),
        slotLabel: photo.slot?.label ?? "—",
        galleryUrl: `${env.NEXT_PUBLIC_APP_URL}/sorties/${sortie.id}`,
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
