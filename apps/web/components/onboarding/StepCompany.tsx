"use client";

import { useState } from "react";
import { inputClass } from "@/components/ui/Input";
import type { Company } from "@/lib/onboarding/types";

// Récupération du site simulée (~1,1s) — pas de scraping réel branché pour l'instant.
// Devine juste un nom à partir du domaine, comme le ferait un enrichissement OG basique.
function guessNameFromWebsite(website: string): string {
  const host = website
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/.]/)[0];
  const base = host || "votre structure";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function StepCompany({
  company,
  onChange,
}: {
  company: Company;
  onChange: (patch: Partial<Company>) => void;
}) {
  const [fetchState, setFetchState] = useState<"idle" | "loading" | "done">("idle");
  const [guessedName, setGuessedName] = useState("");

  function analyze() {
    if (!company.website.trim() || fetchState === "loading") return;
    setFetchState("loading");
    const nice = guessNameFromWebsite(company.website);
    setTimeout(() => {
      setGuessedName(nice);
      setFetchState("done");
      if (!company.name.trim()) onChange({ name: nice });
    }, 1100);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Parlez-nous de votre activité
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Renseignez votre site : on essaie de récupérer votre nom pour vous. Vous pourrez tout modifier.
      </p>

      <div className="mt-8 flex max-w-md flex-col gap-4">
        <Field label="Site internet">
          <input
            type="url"
            placeholder="https://votre-structure.fr"
            value={company.website}
            onChange={(e) => onChange({ website: e.target.value })}
            onBlur={analyze}
            onKeyDown={(e) => e.key === "Enter" && analyze()}
            className={`${inputClass} w-full`}
          />
        </Field>

        {fetchState === "loading" && (
          <div className="flex animate-fade-slide-up items-start gap-3 rounded-card border border-accent bg-accent-tint p-3.5">
            <span className="mt-0.5 h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <div>
              <p className="text-sm font-semibold text-ink">Analyse de votre site…</p>
              <p className="mt-0.5 text-xs text-ink-2">On récupère vos informations.</p>
            </div>
          </div>
        )}

        {fetchState === "done" && (
          <div className="flex animate-fade-slide-up items-start gap-3 rounded-card border border-accent bg-accent-tint p-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-surface font-display text-sm font-extrabold text-accent shadow-card">
              {guessedName[0] ?? "S"}
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">Nous avons trouvé ces informations ✓</p>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-2">
                <strong className="text-ink">{guessedName}</strong> — vous pourrez tout modifier.
              </p>
            </div>
          </div>
        )}

        <Field label="Nom de l'entreprise">
          <input
            type="text"
            placeholder="Vol Passion Annecy"
            value={company.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className={`${inputClass} w-full`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Instagram">
            <div className="relative flex items-center">
              <span className="pointer-events-none absolute left-3.5 select-none text-sm text-muted">@</span>
              <input
                type="text"
                placeholder="volpassionannecy"
                value={company.instagram}
                onChange={(e) => onChange({ instagram: e.target.value.replace(/^@/, "") })}
                className={`${inputClass} w-full pl-8`}
              />
            </div>
          </Field>
          <Field label="Ville / région">
            <input
              type="text"
              placeholder="Annecy"
              value={company.city}
              onChange={(e) => onChange({ city: e.target.value })}
              className={`${inputClass} w-full`}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
      {label}
      {children}
    </label>
  );
}
