import { z } from "zod";
import { getOperatorUser } from "@/lib/current-user";
import { checkRateLimit } from "@/lib/rate-limit";
import { redeemFeeCode } from "@/lib/fee-waiver";

const schema = z.object({ code: z.string().min(1).max(40) });

/** Le pro saisit un code « commission offerte » dans Réglages. */
export async function POST(request: Request): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Un code ne se devine pas à l'essai : 10 tentatives par heure et par compte.
  const { allowed } = await checkRateLimit(`fee-code:${dbUser.operatorId}`, { max: 10, windowMs: 60 * 60 * 1000 });
  if (!allowed) {
    return Response.json({ error: "rate_limited", message: "Trop d'essais. Réessayez dans une heure." }, { status: 429 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid", message: "Saisissez votre code." }, { status: 400 });

  let result;
  try {
    result = await redeemFeeCode(dbUser.operatorId, parsed.data.code);
  } catch (error) {
    console.error("[fee-code] vérification chez Stripe impossible", error);
    return Response.json({ error: "stripe", message: "Le code n'a pas pu être vérifié. Réessayez dans un instant." }, { status: 502 });
  }
  if (!result.ok) return Response.json({ error: result.error, message: result.message }, { status: 400 });
  return Response.json({ days: result.days });
}
