import { prisma } from "@/lib/prisma";
import { getSortieSlots } from "@/lib/gallery-group";

// Public, non authentifié — écran 2 (choix du créneau au sein du jour choisi).
export async function GET(_request: Request, { params }: { params: { shareToken: string; sortieId: string } }): Promise<Response> {
  const operator = await prisma.operator.findUnique({ where: { shareToken: params.shareToken }, select: { id: true } });
  if (!operator) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  const sortie = await prisma.sortie.findFirst({ where: { id: params.sortieId, operatorId: operator.id, mode: "GROUPE" }, select: { id: true } });
  if (!sortie) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const data = await getSortieSlots(sortie.id);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(data);
}
