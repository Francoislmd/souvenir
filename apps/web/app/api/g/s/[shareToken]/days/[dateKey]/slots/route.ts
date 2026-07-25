import { getSlotsForDate } from "@/lib/gallery-group";

// Public, non authentifié — écran 2 (choix du créneau au sein du jour
// choisi). dateKey regroupe potentiellement plusieurs sorties d'un même
// opérateur tombant le même jour calendaire.
export async function GET(_request: Request, { params }: { params: { shareToken: string; dateKey: string } }): Promise<Response> {
  const data = await getSlotsForDate(params.shareToken, params.dateKey);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(data);
}
