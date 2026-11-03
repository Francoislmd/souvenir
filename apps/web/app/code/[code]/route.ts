import { NextResponse } from "next/server";
import { getOperatorUser } from "@/lib/current-user";
import { FEE_CODE_COOKIE, normalizeFeeCode, redeemFeeCode } from "@/lib/fee-waiver";

export const dynamic = "force-dynamic";

/**
 * Le lien qu'on envoie à un pro : linktrip.co/code/AB3K-7MQP.
 *
 * Déjà inscrit et connecté : le code s'applique tout de suite, retour à
 * Réglages qui dit le résultat. Sinon : le code est gardé dans un cookie et
 * s'applique à la création du compte (POST /api/operator).
 */
export async function GET(request: Request, { params }: { params: { code: string } }): Promise<Response> {
  const code = normalizeFeeCode(decodeURIComponent(params.code));
  const base = new URL(request.url);

  const dbUser = await getOperatorUser();
  if (dbUser) {
    const result = await redeemFeeCode(dbUser.operatorId, code);
    const url = new URL("/reglages", base);
    url.searchParams.set("code", result.ok ? "ok" : result.error);
    url.hash = "prix";
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
