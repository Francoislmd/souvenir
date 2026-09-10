import { prisma } from "@/lib/prisma";
import { getSlotPhotos } from "@/lib/gallery-group";
import { resolveOperator } from "@/lib/store";

// Public, non authentifié — permet à la grille du créneau de rafraîchir
// discrètement les photos encore en traitement, sans recharger la page (même
// pattern que /api/g/[token]/photos côté individuel).
//
// Le créneau est cherché DANS les sorties de cet opérateur : un identifiant de
// créneau valide ne doit pas servir à lire les photos d'un autre prestataire.
export async function GET(_request: Request, { params }: { params: { slug: string; slotId: string } }): Promise<Response> {
  const operator = await resolveOperator(params.slug);
  if (!operator) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const slot = await prisma.slot.findFirst({ where: { id: params.slotId, sortie: { operatorId: operator.id, mode: "GROUPE" } } });
  if (!slot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await getSlotPhotos(slot.id, operator.name);
  return Response.json({ photos });
}
