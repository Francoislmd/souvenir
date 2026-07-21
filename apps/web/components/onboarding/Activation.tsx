"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/Button";

const BASE_CHECKLIST_ITEMS = [
  "Profil créé",
  "Marque configurée",
  "Activité ajoutée",
  "Galerie prête",
  "Prix configurés",
];

export function Activation({
  stripeOnboarded,
  onOpenDashboard,
}: {
  stripeOnboarded: boolean;
  onOpenDashboard: () => void;
}) {
  const checklistItems = stripeOnboarded
    ? [...BASE_CHECKLIST_ITEMS, "Paiements activés"]
    : BASE_CHECKLIST_ITEMS;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setTimeout(() => {
      const colors = ["#FF3D6E", "#FF5A1F", "#FFB443", "#0FBEB6"];
      const fire = (options: confetti.Options): void => {
        void confetti({ particleCount: 70, spread: 68, startVelocity: 42, ticks: 200, gravity: 1.1, colors, ...options });
      };
      fire({ angle: 60, origin: { x: 0, y: 0.9 } });
      fire({ angle: 120, origin: { x: 1, y: 0.9 } });
    }, 260);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-lg text-center">
      <div
        className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full shadow-card"
        style={{ background: "var(--brand-gradient)" }}
      >
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight text-ink sm:text-[2.1rem]">
        Votre activité est prête.
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-base leading-relaxed text-ink-2">
        Tout est en place. Votre prochaine expérience peut déjà devenir un souvenir.
      </p>

      <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5">
        {checklistItems.map((item, i) => (
          <div
            key={item}
            className="flex animate-fade-slide-up items-center gap-3 rounded-control border border-border bg-surface px-4 py-3 shadow-card"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: "var(--brand-gradient)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            <span className="text-sm font-semibold text-ink">{item}</span>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Button variant="accent" size="lg" onClick={onOpenDashboard} className="w-full sm:w-auto">
          Voir mon espace Souvenir
        </Button>
      </div>
    </div>
  );
}
