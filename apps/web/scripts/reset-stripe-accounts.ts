import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

/**
 * Oublie les comptes Stripe des opérateurs.
 *
 * Pourquoi ce script existe : le 19/09/2026, Linktrip a changé de compte
 * Stripe plateforme (un compte dédié, en charge directe). Les comptes
 * connectés `acct_…` rangés dans Operator.stripeAccountId appartiennent à
 * l'ancienne plateforme : avec les nouvelles clés, Stripe répond « No such
 * account » à chaque paiement et à chaque ouverture du formulaire
 * d'inscription. Les vider fait recréer un compte sur la nouvelle plateforme
 * au prochain passage de l'opérateur dans Réglages (ensureStripeAccount).
 *
 * À lancer une seule fois, APRÈS avoir mis les nouvelles clés dans .env.local
 * (le script touche la base, pas Stripe : les clés ne servent qu'à rappeler
 * sur quel compte on travaille).
 *
 *   pnpm --filter @souvenir/web stripe:reset-accounts -- --dry-run
 *   pnpm --filter @souvenir/web stripe:reset-accounts
 *
 * Les commandes en cours (`pending`, `failed`) gardent leur stripePi : il
 * pointe vers l'ancienne plateforme, lib/checkout.ts échoue à le mettre à
 * jour et en recrée un sur le bon compte. Rien à nettoyer de ce côté.
 */

async function main(): Promise<void> {
  const dryRun = process.argv.slice(2).includes("--dry-run");
  const { prisma } = await import("../lib/prisma");

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  console.log(`Clé Stripe dans .env.local : ${key.startsWith("sk_live_") ? "LIVE" : key.startsWith("sk_test_") ? "test" : "absente"}`);

  const operators = await prisma.operator.findMany({
    where: { OR: [{ stripeAccountId: { not: null } }, { stripeOnboarded: true }] },
    select: { id: true, name: true, stripeAccountId: true, stripeOnboarded: true },
    orderBy: { name: "asc" },
  });

  if (operators.length === 0) {
    console.log("Aucun opérateur n'a de compte Stripe enregistré. Rien à faire.");
    return;
  }

  for (const o of operators) {
    console.log(`- ${o.name} : ${o.stripeAccountId ?? "(sans compte)"}${o.stripeOnboarded ? ", paiements activés" : ""}`);
  }

  if (dryRun) {
    console.log(`\n--dry-run : ${operators.length} opérateur(s) seraient remis à zéro. Rien n'a été écrit.`);
    return;
  }

  const { count } = await prisma.operator.updateMany({
    where: { id: { in: operators.map((o) => o.id) } },
    data: { stripeAccountId: null, stripeOnboarded: false },
  });
  console.log(`\n${count} opérateur(s) remis à zéro. Ils refont l'inscription Stripe dans Réglages.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma");
    await prisma.$disconnect();
  });
