"use client";

import { useEffect, useState } from "react";
import { estimateRevenue } from "@/lib/onboarding/estimate";
import { formatEuros } from "@/lib/format";
import type { Experience } from "@/lib/onboarding/types";

export function ValueEstimate({ exp, packPriceCents }: { exp: Experience; packPriceCents: number }) {
  const { monthly, buyers, revenueCents } = estimateRevenue(exp.group, exp.freq, packPriceCents);

  const rows: { value: number; format: (n: number) => string; label: string; grad?: boolean }[] = [
    { value: monthly, format: (n) => n.toLocaleString("fr-FR"), label: "participants accueillis par mois" },
    { value: buyers, format: (n) => n.toLocaleString("fr-FR"), label: "clients qui achètent leurs photos" },
    { value: revenueCents, format: (n) => formatEuros(n), label: "de revenus supplémentaires potentiels", grad: true },
    { value: buyers, format: (n) => `+${n.toLocaleString("fr-FR")}`, label: "souvenirs partagés — autant de visibilité" },
  ];

  return (
    <div className="mx-auto max-w-lg text-center">
      <span className="text-xs font-bold uppercase tracking-[.14em] text-accent">Presque prêt</span>
      <h2 className="mt-2.5 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Voici ce que Souvenir pourrait générer.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-ink-2">
        Une estimation à partir de vos réponses. Rien n&apos;est garanti — mais l&apos;ordre de grandeur est parlant.
      </p>

      <div className="mt-8 flex flex-col gap-3.5">
        {rows.map((row, i) => (
          <EstimateRow key={i} {...row} delayMs={i * 160} />
        ))}
      </div>

      <p className="mt-5 text-xs text-muted">
        Estimation indicative basée sur un taux d&apos;achat moyen observé (~35 %). Vos résultats varient selon la
        saison et l&apos;activité.
      </p>
    </div>
  );
}

function EstimateRow({
  value,
  format,
  label,
  grad,
  delayMs,
}: {
  value: number;
  format: (n: number) => string;
  label: string;
  grad?: boolean;
  delayMs: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const duration = 900;
    let raf = 0;
    const start = performance.now() + delayMs;

    function tick(now: number) {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, delayMs]);

  return (
    <div
      className="flex animate-fade-slide-up items-center gap-4 rounded-card border border-border bg-surface p-5 text-left shadow-card"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className={`min-w-[8.5ch] font-display text-3xl font-extrabold tracking-tight ${grad ? "" : "text-ink"}`}
        style={
          grad
            ? {
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }
            : undefined
        }
      >
        {format(display)}
      </span>
      <span className="text-sm leading-snug text-ink-2">{label}</span>
    </div>
  );
}
