import { prisma } from "@/lib/prisma";
import { getBoutiquePhotos } from "@/lib/gallery";
import { accessFromOrders } from "@/lib/access";

// Public, non authentifié (protégé par le token non devinable) — permet à la
// galerie client de rafraîchir discrètement les photos encore en traitement
// au moment de l'ouverture, sans recharger la page.
export async function GET(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { orders: true, sortie: { include: { operator: true } } },
  });
  if (!participant || participant.deletedAt) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const access = accessFromOrders(participant.orders, participant.sortie.operator.priceAllCents);
  const photos = await getBoutiquePhotos(participant, access.ids, participant.sortie.operator.name, access.packReached);

  return Response.json({ photos });
}
