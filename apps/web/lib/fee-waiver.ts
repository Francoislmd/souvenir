import type Stripe from "stripe";
import { Prisma } from "@souvenir/db";
import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { track } from "./analytics";

/**
 * Les codes « commission offerte » : un code, un pro, une fois. Les codes
 * vivent dans Stripe, sur le compte plateforme.
 *
 * Dans le tableau de bord Stripe (Catalogue de produits → Coupons) :
 * 1. un coupon à **100 %** ; sa durée donne la période offerte. « Plusieurs
 *    mois » → 30 jours par mois (3 mois = 90 jours) ; sinon 90 jours. Une
 *    métadonnée `jours` (ex. `jours = 90`) l'emporte sur tout le reste ;
 * 2. dans ce coupon, autant de codes promo que de pros, avec ou sans date
 *    d'expiration. Stripe garde la liste, Linktrip ne crée rien.
 *
 * Le pro saisit le code dans Réglages, ou ouvre le lien `/code/{code}`. Linktrip
 * le cherche chez Stripe, vérifie qu'il est actif et porte sur un coupon à
 * 100 %, l'enregistre (FeeWaiverCode), pose `Operator.feeWaiverDays`, puis
 * **désactive le code chez Stripe** avec en métadonnées le pro qui l'a pris :
 * le tableau de bord montre ce qui est utilisé et par qui.
 *
 * 🔒 La période démarre à la **première vente**, pas à l'activation (décidé le
 * 03/11/2026) : un pro qui active son code hors saison ne le perd pas.
 * `startFeeWaiverClock`, appelé au paiement réussi (lib/order-fulfillment.ts),
 * pose `feeWaivedUntil` = date de la vente + `feeWaiverDays`.
 *
 * Avant la première vente et pendant la période, `effectiveFeePercent` vaut 0 : le PaymentIntent part
 * sans `application_fee_amount` (lib/checkout.ts) et la vente ne figure pas sur
 * les factures de commission (lib/invoicing.ts écarte les commissions nulles).
 *
 * Mode test / mode réel : le code doit exister dans le même mode que
 * STRIPE_SECRET_KEY.
 */

/** Le cookie qui garde le code d'un lien ouvert avant d'avoir un compte. */
export const FEE_CODE_COOKIE = "lt_fee_code";

const DEFAULT_DAYS = 90;

/** Ce que le pro a saisi, sans espaces autour. Stripe ignore la casse. */
export function cleanFeeCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").slice(0, 64);
}

type WaiverFields = { feePercent: number; feeWaiverDays: number | null; feeWaivedUntil: Date | null };

/** La commission qui s'applique à une vente faite maintenant. */
export function effectiveFeePercent(operator: WaiverFields, now = new Date()): number {
  if (operator.feeWaivedUntil) return operator.feeWaivedUntil > now ? 0 : operator.feePercent;
  // Code activé, période pas encore démarrée : la vente qui la démarre est offerte aussi.
  return operator.feeWaiverDays ? 0 : operator.feePercent;
}

/**
 * Première vente d'un pro qui a un code en attente : la période démarre.
 * Sans effet si elle a déjà démarré (garde `feeWaivedUntil: null`, rejouable).
 */
export async function startFeeWaiverClock(
  operator: { id: string; feeWaiverDays: number | null; feeWaivedUntil: Date | null },
  paidAt: Date,
): Promise<void> {
  if (!operator.feeWaiverDays || operator.feeWaivedUntil) return;
  const until = new Date(paidAt.getTime() + operator.feeWaiverDays * 24 * 60 * 60 * 1000);
  await prisma.operator.updateMany({ where: { id: operator.id, feeWaivedUntil: null }, data: { feeWaivedUntil: until } });
}

/** La période offerte par un coupon Stripe. */
export function waiverDays(coupon: Stripe.Coupon): number {
  const fromMeta = Number(coupon.metadata?.jours ?? coupon.metadata?.days);
  if (Number.isInteger(fromMeta) && fromMeta > 0) return fromMeta;
  if (coupon.duration === "repeating" && coupon.duration_in_months) return coupon.duration_in_months * 30;
  return DEFAULT_DAYS;
}

export type RedeemResult =
  | { ok: true; days: number }
  | { ok: false; error: "invalid" | "used" | "already"; message: string };

const MESSAGES = {
  invalid: "Ce code n'existe pas ou n'est plus valable.",
  used: "Ce code a déjà été utilisé.",
  already: "Votre compte a déjà profité d'un code.",
} as const;

function fail(error: keyof typeof MESSAGES): RedeemResult {
  return { ok: false, error, message: MESSAGES[error] };
}

async function findPromotionCode(code: string): Promise<Stripe.PromotionCode | null> {
  // Le filtre `code` de Stripe ignore la casse. Un code désactivé est
  // renvoyé aussi : c'est ce qui permet de dire « déjà utilisé ».
  const { data } = await stripe.promotionCodes.list({ code, limit: 10 });
  return data.find((p) => p.active) ?? data[0] ?? null;
}

export async function redeemFeeCode(operatorId: string, raw: string, now = new Date()): Promise<RedeemResult> {
  const code = cleanFeeCode(raw);
  if (code.length < 3) return fail("invalid");

  const promo = await findPromotionCode(code);
  if (!promo) return fail("invalid");

  // Le même lien rouvert par le même pro : rien à refaire.
  const mine = await prisma.feeWaiverCode.findUnique({
    where: { stripePromotionCodeId: promo.id },
    select: { operatorId: true, durationDays: true },
  });
  if (mine) {
    if (mine.operatorId === operatorId) return { ok: true, days: mine.durationDays };
    return fail("used");
  }

  const coupon = promo.coupon;
  if (coupon.percent_off !== 100 || !coupon.valid) return fail("invalid");
  if (!promo.active) {
    // Désactivé à la main, ou utilisé par une autre plateforme : pas à nous de deviner.
    return promo.metadata?.operatorId ? fail("used") : fail("invalid");
  }
  if (promo.expires_at && promo.expires_at * 1000 < now.getTime()) return fail("invalid");
  if (promo.max_redemptions !== null && promo.times_redeemed >= promo.max_redemptions) return fail("used");

  const durationDays = waiverDays(coupon);
  try {
    await prisma.$transaction([
      prisma.feeWaiverCode.create({
        data: { code: promo.code.toUpperCase(), stripePromotionCodeId: promo.id, stripeCouponId: coupon.id, durationDays, redeemedAt: now, operatorId },
      }),
      prisma.operator.update({ where: { id: operatorId }, data: { feeWaiverDays: durationDays, feeWaivedUntil: null } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String((error.meta as { target?: unknown } | undefined)?.target ?? "");
      return fail(target.includes("operatorId") ? "already" : "used");
    }
    throw error;
  }

  // Le code ne sert plus : on le désactive chez Stripe, avec le nom du pro.
  // Un échec ici ne retire rien au pro, la table locale empêche déjà un
  // deuxième usage ; on le note pour le refaire à la main.
  try {
    const op = await prisma.operator.findUnique({ where: { id: operatorId }, select: { name: true, slug: true } });
    await stripe.promotionCodes.update(promo.id, {
      active: false,
      metadata: {
        operatorId,
        operator: op?.name ?? "",
        slug: op?.slug ?? "",
        redeemedAt: now.toISOString(),
        jours: String(durationDays),
        depart: "première vente",
      },
    });
  } catch (error) {
    console.error("[fee-code] code utilisé mais pas désactivé chez Stripe", promo.id, error);
  }

  await track("fee_code_redeemed", { operatorId, meta: { code: promo.code, promotionCode: promo.id, durationDays } }).catch(() => undefined);
  return { ok: true, days: durationDays };
}
