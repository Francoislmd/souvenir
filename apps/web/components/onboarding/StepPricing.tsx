import { inputClass } from "@/components/ui/Input";
import type { Pricing } from "@/lib/onboarding/types";

// Miroir du défaut Operator.feePercent (20%) — voir packages/db/prisma/schema.prisma.
const OPERATOR_KEEP_PERCENT = 80;

function Row({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-4 rounded-card border border-border bg-surface p-4">
      <div className="flex-1">
        <h4 className="font-display text-sm font-bold text-ink">{label}</h4>
        <p className="mt-0.5 text-xs text-muted">{hint}</p>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} h-11 w-20 px-2 text-right font-display text-lg font-extrabold`}
        />
        <span className="font-display text-lg font-extrabold text-ink-2">€</span>
      </div>
    </div>
  );
}

export function StepPricing({ pricing, onChange }: { pricing: Pricing; onChange: (patch: Partial<Pricing>) => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Combien facturer vos souvenirs ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Voici ce que pratiquent des activités comme la vôtre. Ajustez comme vous voulez.
      </p>

      <div className="mt-8 flex max-w-md flex-col gap-2.5">
        <Row label="Une photo" hint="à la carte" value={pricing.photoEuros} onChange={(v) => onChange({ photoEuros: v })} />
        <Row label="Pack de 3 photos" hint="recommandé : 15–30 €" value={pricing.packEuros} onChange={(v) => onChange({ packEuros: v })} />
        <Row label="Toutes les photos" hint="prix plafond" value={pricing.allEuros} onChange={(v) => onChange({ allEuros: v })} />

        <p className="mt-2 rounded-control bg-canvas px-4 py-3 text-sm text-ink-2">
          Vous gardez <strong className="text-ink">{OPERATOR_KEEP_PERCENT} %</strong> de chaque vente.
        </p>
      </div>
    </div>
  );
}
