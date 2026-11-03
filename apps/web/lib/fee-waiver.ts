import { randomInt } from "crypto";
import { Prisma } from "@souvenir/db";
import { prisma } from "./prisma";
import { track } from "./analytics";

/**
 * Les codes « commission offerte » : un code, un pro, une fois.
 *
 * Linktrip crée les codes (scripts/create-fee-codes.ts) et les remet un par un,
 * en lien (`/code/{code}`) ou à saisir dans Réglages. Le pro qui l'utilise ne
 * paie aucune commission pendant `durationDays` jours (90 par défaut) à partir
 * de ce moment : `Operator.feeWaivedUntil`, lu au paiement par
 * `effectiveFeePercent` (lib/checkout.ts). Les ventes de la période ont
 * `feeCents = 0` et ne partent pas sur les factures (lib/invoicing.ts écarte
 * déjà les commissions nulles).
 */

/** Sans 0/O ni 1/I/L : un code se lit au téléphone. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

/** Le cookie qui garde le code d'un lien ouvert avant d'avoir un compte. */
export const FEE_CODE_COOKIE = "lt_fee_code";

export function generateFeeCode(): string {
  let code = "";
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** « ab3k-7mqp » , « AB3K 7MQP » → « AB3K7MQP ». */
export function normalizeFeeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 32);
}

/** « AB3K7MQP » → « AB3K-7MQP », la forme qu'on donne au pro. */
export function formatFeeCode(code: string): string {
  return code.length === LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** La commission qui s'applique à une vente faite maintenant. */
export function effectiveFeePercent(
  operator: { feePercent: number; feeWaivedUntil: Date | null },
  now = new Date(),
): number {
  return operator.feeWaivedUntil && operator.feeWaivedUntil > now ? 0 : operator.feePercent;
}

export type RedeemResult =
  | { ok: true; until: Date }
  | { ok: false; error: "invalid" | "used" | "already"; message: string };

const MESSAGES = {
  invalid: "Ce code n'existe pas. Vérifiez-le, il compte 8 caractères.",
  used: "Ce code a déjà été utilisé.",
  already: "Votre compte a déjà profité d'un code.",
} as const;

function fail(error: keyof typeof MESSAGES): RedeemResult {
  return { ok: false, error, message: MESSAGES[error] };
}

export async function redeemFeeCode(operatorId: string, raw: string, now = new Date()): Promise<RedeemResult> {
  const code = normalizeFeeCode(raw);
  if (code.length < 4) return fail("invalid");

  const found = await prisma.feeWaiverCode.findUnique({ where: { code } });
  if (!found) return fail("invalid");

  // Le même lien rouvert par le même pro : rien à refaire.
  if (found.operatorId === operatorId) {
    const op = await prisma.operator.findUnique({ where: { id: operatorId }, select: { feeWaivedUntil: true } });
    if (op?.feeWaivedUntil) return { ok: true, until: op.feeWaivedUntil };
  }
  if (found.redeemedAt) return fail("used");

  const until = new Date(now.getTime() + found.durationDays * 24 * 60 * 60 * 1000);
  try {
    const claimed = await prisma.$transaction(async (tx) => {
      // Réservation : seul le premier à poser operatorId sur un code libre passe.
      const { count } = await tx.feeWaiverCode.updateMany({
        where: { id: found.id, redeemedAt: null },
        data: { redeemedAt: now, operatorId },
      });
      if (count === 0) return false;
      await tx.operator.update({ where: { id: operatorId }, data: { feeWaivedUntil: until } });
      return true;
    });
    if (!claimed) return fail("used");
  } catch (error) {
    // operatorId @unique : ce pro a déjà un code.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return fail("already");
    throw error;
  }

  await track("fee_code_redeemed", { operatorId, meta: { code, durationDays: found.durationDays } }).catch(() => undefined);
  return { ok: true, until };
}

/** « 1 février 2027 ». */
export function feeWaiverDateLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
}
