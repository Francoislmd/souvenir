import { getOperatorUser } from "@/lib/current-user";
import { getSaleDetail } from "@/lib/sale-detail";

// Le détail d'un achat, pour la fenêtre ouverte depuis Revenus. Limité aux
// commandes des sorties de l'opérateur connecté (getSaleDetail filtre).
export async function GET(_request: Request, { params }: { params: { orderId: string } }): Promise<Response> {
  const user = await getOperatorUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sale = await getSaleDetail(user.operatorId, params.orderId);
  if (!sale) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ sale });
}
