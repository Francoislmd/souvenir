import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifiedEmail } from "@/lib/current-user";
import { Onboarding, type OnboardingOperator, type OnboardingStep } from "@/components/onboarding/Onboarding";

export const metadata: Metadata = {
  title: "Créer votre compte · Linktrip",
  robots: { index: false },
};

// L'étape dépend de la session et de la base : jamais de cache.
export const dynamic = "force-dynamic";

/** « Vol Passion Annecy » depuis « vol-passion-annecy » (le champ du héros). */
function humanize(raw: string): string {
  if (!raw.includes("-") && raw !== raw.toLowerCase()) return raw;
  return raw
    .split(/[-\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function storeBase(): string {
  const store = process.env.NEXT_PUBLIC_STORE_URL?.trim();
  const base = store ? store : `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "")}/s`;
  return `${base.replace(/^https?:\/\//, "").replace(/\/+$/, "")}/`;
}

/**
 * L'inscription reprend là où le pro l'a laissée, d'après ce qui existe :
 * pas de session → le compte ; une session sans structure → la structure ;
 * une structure sans sortie → sa page, ou directement la sortie si Stripe
 * est déjà ouvert. Avec une sortie, l'inscription est finie.
 */
export default async function SignupPage({ searchParams }: { searchParams: { name?: string; email?: string } }) {
  const email = await verifiedEmail();
  const initialName = humanize((searchParams.name ?? "").trim());

  let step: OnboardingStep = "compte";
  let operator: OnboardingOperator | null = null;

  if (email) {
    const user = await prisma.user.findUnique({ where: { email }, include: { operator: true } });
    if (!user) {
      step = "structure";
    } else {
      const o = user.operator;
      const hasSortie = await prisma.sortie.findFirst({ where: { operatorId: o.id }, select: { id: true } });
      if (hasSortie) redirect("/sorties");
      operator = {
        name: o.name,
        slug: o.slug,
        activities: o.activities,
        logoUrl: o.logoUrl,
        coverUrl: o.coverUrl,
        tagline: o.tagline ?? null,
        priceAllCents: o.priceAllCents,
        pricePhotoCents: o.pricePhotoCents,
        packOnly: o.packOnly,
        stripeOnboarded: o.stripeOnboarded,
      };
      step = o.stripeAccountId ? "sortie" : "page";
    }
  }

  return (
    <Onboarding
      // Une nouvelle étape de départ (après la vérification du code, par
      // router.refresh) remonte le composant plutôt que de réconcilier un état
      // devenu faux.
      key={step}
      initialStep={step}
      initialEmail={(searchParams.email ?? "").trim()}
      initialName={initialName}
      operator={operator}
      storeBase={storeBase()}
    />
  );
}
