import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";
import { sendPhotoWithdrawalNotifiedEmail } from "@/lib/email";
import { resolveOperator } from "@/lib/store";
import { checkRateLimit, requestIp } from "@/lib/rate-limit";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// Public, non authentifié — c'est le principe même du retrait "sans
// justification" (brief §5.3) : aucune preuve d'achat ni d'identité n'est
// demandée. Masquage immédiat, avant même traitement. La boutique étant
// ouverte à qui connaît le nom du prestataire, ce retrait est le seul recours
// de quelqu'un qui ne veut pas y figurer : il ne doit rien exiger.
export async function POST(request: Request, { params }: { params: { slug: string; photoId: string } }): Promise<Response> {
  try {
    // Le retrait n'exige aucune justification, c'est un choix produit. Mais
    // les identifiants de photos sont servis publiquement par la route
    // voisine : sans limite de débit, un script masque tout le catalogue d'un
    // prestataire en quelques secondes. Le plafond est haut — une famille qui
    // retire ses six photos passe sans s'en apercevoir — et bas devant un
    // script.
    const { allowed } = await checkRateLimit(`hide:ip:${requestIp(request)}`, { max: 20, windowMs: 15 * 60 * 1000 });
    if (!allowed) {
      return Response.json({ error: "Trop de demandes, réessayez dans quelques minutes." }, { status: 429 });
    }

    const operator = await resolveOperator(params.slug);
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
        slotLabel: photo.slot?.label ?? "-",
        galleryUrl: `${env.NEXT_PUBLIC_APP_URL}/sorties/${photo.sortieId}`,
      });
    } catch (error) {
      // Le masquage a déjà eu lieu — une notification manquée ne doit jamais
      // faire échouer la requête ni redonner l'impression que le retrait n'a pas marché.
      console.error("[API /api/store/[slug]/photos/[photoId]/hide] notification email failed", error);
    }

    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("[API /api/store/[slug]/photos/[photoId]/hide]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
