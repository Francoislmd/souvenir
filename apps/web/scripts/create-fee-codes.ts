import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Crée des codes « commission offerte » (lib/fee-waiver.ts).
 *
 * Chaque code est à remettre à UN pro : il ne sert qu'une fois, et supprime la
 * commission Linktrip pendant 90 jours à partir du moment où il est utilisé.
 * Le script affiche le code et le lien à envoyer.
 *
 *   pnpm --filter @souvenir/web fee-codes:create -- --note "Palomano"
 *   pnpm --filter @souvenir/web fee-codes:create -- --count 5 --note "Salon nautique"
 *   pnpm --filter @souvenir/web fee-codes:create -- --days 60
 *   pnpm --filter @souvenir/web fee-codes:create -- --list
 *
 * Attention : le script écrit dans la base de .env.local. Pour la production,
 * .env.local doit pointer sur la base de production.
 */

function arg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main(): Promise<void> {
  const { prisma } = await import("../lib/prisma");
  const { generateFeeCode, formatFeeCode } = await import("../lib/fee-waiver");
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://linktrip.co").replace(/\/+$/, "");

  if (process.argv.includes("--list")) {
    const codes = await prisma.feeWaiverCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { operator: { select: { name: true, feeWaivedUntil: true } } },
    });
    for (const c of codes) {
      const state = c.operator
        ? `utilisé par ${c.operator.name}, offert jusqu'au ${c.operator.feeWaivedUntil?.toLocaleDateString("fr-FR") ?? "?"}`
        : c.redeemedAt
          ? "utilisé (compte supprimé)"
          : "libre";
      console.log(`${formatFeeCode(c.code)}  ${c.durationDays} j  ${c.note ?? ""}  → ${state}`);
    }
    if (codes.length === 0) console.log("Aucun code.");
    return;
  }

  const count = Math.max(1, Math.min(100, Number(arg("count") ?? 1) || 1));
  const days = Math.max(1, Number(arg("days") ?? 90) || 90);
  const note = arg("note") ?? null;

  for (let i = 0; i < count; i++) {
    // Une collision sur 31^8 combinaisons est improbable, mais @unique la refuserait : on retente.
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateFeeCode();
      try {
        await prisma.feeWaiverCode.create({ data: { code, durationDays: days, note } });
        console.log(`${formatFeeCode(code)}   ${appUrl}/code/${formatFeeCode(code)}`);
        break;
      } catch (error) {
        if (attempt === 4) throw error;
      }
    }
  }
  console.log(`\n${count} code(s), ${days} jours de commission offerte chacun, à utiliser une seule fois.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
