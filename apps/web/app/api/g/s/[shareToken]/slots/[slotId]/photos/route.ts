import { prisma } from "@/lib/prisma";
import { getSlotPhotos } from "@/lib/gallery-group";

// Public, non authentifié (protégé par le shareToken non devinable) —
// permet à la grille du créneau de rafraîchir discrètement les photos
// encore en traitement, sans recharger la page (même pattern que
// /api/g/[token]/photos côté individuel).
export async function GET(_request: Request, { params }: { params: { shareToken: string; slotId: string } }): Promise<Response> {
  const operator = await prisma.operator.findUnique({ where: { shareToken: params.shareToken }, select: { id: true } });
  if (!operator) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const slot = await prisma.slot.findFirst({ where: { id: params.slotId, sortie: { operatorId: operator.id, mode: "GROUPE" } } });
  if (!slot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await getSlotPhotos(slot.id);
  return Response.json({ photos });
}
