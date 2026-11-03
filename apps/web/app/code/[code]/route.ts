import { NextResponse } from "next/server";
import { getOperatorUser } from "@/lib/current-user";
import { FEE_CODE_COOKIE, cleanFeeCode, redeemFeeCode } from "@/lib/fee-waiver";
import { checkRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Le lien qu'on envoie à un pro : linktrip.co/code/{code promo Stripe}.
 *
 * Déjà inscrit et connecté : le code s'applique tout de suite, retour à
 * Réglages qui dit le résultat. Sinon : le code est gardé dans un cookie et
 * s'applique à la création du compte (POST /api/operator).
 */
export async function GET(request: Request, { params }: { params: { code: string } }): Promise<Response> {
  const code = cleanFeeCode(decodeURIComponent(params.code));
  const base = new URL(request.url);

  const dbUser = await getOperatorUser();
  if (dbUser) {
    const url = new URL("/reglages", base);
    url.hash = "prix";
    const { allowed } = await checkRateLimit(`fee-code:${dbUser.operatorId}`, { max: 10, windowMs: 60 * 60 * 1000 });
    if (!allowed) {
      url.searchParams.set("code", "rate_limited");
      return NextResponse.redirect(url);
    }
    const result = await redeemFeeCode(dbUser.operatorId, code).catch((error) => {
      console.error("[fee-code] vérification chez Stripe impossible", error);
      return null;
    });
    url.searchParams.set("code", result ? (result.ok ? "ok" : result.error) : "stripe");
    return NextResponse.redirect(url);
  }

  const res = NextResponse.redirect(new URL("/signup", base));
  res.cookies.set(FEE_CODE_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
