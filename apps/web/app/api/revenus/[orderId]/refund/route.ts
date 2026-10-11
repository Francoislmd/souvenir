import { z } from "zod";
import { getOperatorUser } from "@/lib/current-user";
import { refundOrder } from "@/lib/order-refunds";

const body = z.object({ amountCents: z.number().int() });

// Rembourser tout ou partie d'un achat, depuis le détail d'une vente (Revenus).
// Réservé aux administrateurs : c'est de l'argent qui sort du compte du pro.
export async function POST(request: Request, { params }: { params: { orderId: string } }): Promise<Response> {
  const user = await getOperatorUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Seul un administrateur peut rembourser." }, { status: 403 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Montant invalide." }, { status: 400 });

  const result = await refundOrder(user.operatorId, params.orderId, parsed.data.amountCents);
  if (!result.ok) {
    const status = result.error === "not_found" ? 404 : result.error === "stripe" ? 502 : 400;
    return Response.json({ error: result.message }, { status });
  }
  return Response.json(result);
}
