import { getSlotsForDate } from "@/lib/gallery-group";

// Public, non authentifié — les créneaux du jour choisi. Une même date peut
// regrouper plusieurs sorties du même opérateur : elles se retrouvent toutes
// ici, chacune portant son activité.
export async function GET(_request: Request, { params }: { params: { slug: string; dateKey: string } }): Promise<Response> {
  const data = await getSlotsForDate(params.slug.toLowerCase(), params.dateKey);
  if (!data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(data);
}
