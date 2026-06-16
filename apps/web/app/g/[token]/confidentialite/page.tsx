import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { LogoMark } from "@/components/brand/Logo";
import { CLIENT_BRAND_COLOR } from "@/lib/brand";

export default async function PrivacyPage({ params }: { params: { token: string } }) {
  const delivery = await prisma.delivery.findFirst({
    where: { OR: [{ token: params.token }, { code: params.token.toUpperCase() }] },
    include: { session: { include: { operator: true } } },
  });

  if (!delivery) notFound();

  const operator = delivery.session.operator;

  const themeStyle = {
    "--accent": CLIENT_BRAND_COLOR,
    "--accent-tint": `color-mix(in srgb, ${CLIENT_BRAND_COLOR} 12%, white)`,
  } as React.CSSProperties;

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-surface px-4 py-8" style={themeStyle}>
      <Link href={`/g/${delivery.token}`} className="text-sm text-muted underline">
        ← Retour à ta galerie
      </Link>

      <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink">
        Tes photos,
        <br />
        tes règles.
      </h1>

      <div className="mt-6 flex flex-col gap-3">
        <div className="rounded-card border border-border bg-canvas p-4">
          <p className="text-sm font-semibold text-ink">👁 Qui voit quoi</p>
          <p className="mt-1.5 text-sm text-ink-2">
            Tes photos et vidéos ne sont visibles que via ce lien privé. {operator.name} ne peut les réutiliser pour
            sa communication que si tu lui en donnes le droit ci-dessous.
          </p>
        </div>

        <div className="rounded-card border border-border bg-canvas p-4">
          <p className="text-sm font-semibold text-ink">🗓 Rétention 90 jours</p>
          <p className="mt-1.5 text-sm text-ink-2">
            Tes médias originaux sont conservés 90 jours sur nos serveurs, puis supprimés automatiquement.
          </p>
        </div>

        <div className="rounded-card border border-border bg-canvas p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">📸 Droit à l&apos;image</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                delivery.consentImage ? "bg-success-tint text-success" : "bg-surface text-muted"
              }`}
            >
              {delivery.consentImage ? "Tu autorises" : "Tu as refusé"}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink-2">
            Tu peux changer d&apos;avis à tout moment depuis ta galerie, en cochant ou décochant la case
            d&apos;autorisation.
          </p>
        </div>
      </div>

      <a
        href={`mailto:contact@souvenir.app?subject=${encodeURIComponent(`Suppression de mes données — ${delivery.code}`)}`}
        className="mt-6 flex h-11 items-center justify-center rounded-control border border-border text-sm font-semibold text-ink transition hover:border-border-strong active:scale-[0.99]"
      >
        🗑 Demander la suppression
      </a>

      <footer className="mt-10 flex flex-col items-center gap-2 pb-6 text-center text-xs text-muted">
        <span className="inline-flex items-center gap-1.5">
          <LogoMark className="h-4 w-4" />
          via Souvenir
        </span>
      </footer>
    </main>
  );
}
