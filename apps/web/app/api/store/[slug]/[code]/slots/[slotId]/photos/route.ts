import { prisma } from "@/lib/prisma";
import { getSlotPhotos } from "@/lib/gallery-group";
import { resolveStore } from "@/lib/store";

// Public, non authentifié (protégé par le code de la sortie) — permet à la
// grille du créneau de rafraîchir discrètement les photos encore en
// traitement, sans recharger la page (même pattern que /api/g/[token]/photos
// côté individuel).
//
// Le créneau est cherché DANS la sortie du code, jamais dans tout l'historique
// de l'opérateur : un code valide ne doit pas servir de passe-partout vers les
// photos d'un autre jour.
export async function GET(_request: Request, { params }: { params: { slug: string; code: string; slotId: string } }): Promise<Response> {
  const store = await resolveStore(params.slug, params.code);
  if (!store) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const slot = await prisma.slot.findFirst({ where: { id: params.slotId, sortieId: store.sortie.id } });
  if (!slot) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const photos = await getSlotPhotos(slot.id, store.operator.name);
  return Response.json({ photos });
}
