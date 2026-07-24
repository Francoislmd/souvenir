import { prisma } from "@/lib/prisma";
import { getBoutiquePhotos } from "@/lib/gallery";

// Public, non authentifié (protégé par le token non devinable) — permet à la
// galerie client de rafraîchir discrètement les photos encore en traitement
// au moment de l'ouverture, sans recharger la page.
export async function GET(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { order: true },
  });
  if (!participant || participant.deletedAt) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const purchasedIds = participant.order?.status === "succeeded" ? participant.order.photoIds : [];
  const photos = await getBoutiquePhotos(participant, new Set(purchasedIds));

  return Response.json({ photos });
}
