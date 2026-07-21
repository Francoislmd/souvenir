import { inputClass } from "@/components/ui/Input";

// Miroir du défaut Operator.feePercent (20%) — voir packages/db/prisma/schema.prisma.
const OPERATOR_KEEP_PERCENT = 80;

export function StepPricing({ packEuros, onChange }: { packEuros: string; onChange: (v: string) => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Combien facturer vos souvenirs ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Voici ce que pratiquent des activités comme la vôtre. Ajustez comme vous voulez.
      </p>

      <div className="mt-8 max-w-md">
        <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-tint text-accent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="7" width="14" height="12" rx="2" />
              <path d="M7 7V5h14v12h-2" />
            </svg>
          </span>
          <div className="flex-1">
            <h4 className="font-display text-base font-bold text-ink">Pack de photos</h4>
            <p className="mt-0.5 text-xs text-muted">recommandé : 15–30 €</p>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              value={packEuros}
              onChange={(e) => onChange(e.target.value)}
              className={`${inputClass} h-11 w-20 px-2 text-right font-display text-lg font-extrabold`}
            />
            <span className="font-display text-lg font-extrabold text-ink-2">€</span>
          </div>
        </div>

        <p className="mt-4 rounded-control bg-canvas px-4 py-3 text-sm text-ink-2">
          Pour une activité comme la vôtre, les prestataires vendent généralement leurs packs entre{" "}
          <strong className="text-ink">15 et 30 €</strong>. Vous gardez{" "}
          <strong className="text-ink">{OPERATOR_KEEP_PERCENT} %</strong> de chaque vente.
        </p>
      </div>
    </div>
  );
}
