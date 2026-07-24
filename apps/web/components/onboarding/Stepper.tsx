const STEP_LABELS = ["Activité", "Entreprise", "Expérience", "Marque", "Revenus"];

// current: index 0-5 (Activité..Revenus). Affiché uniquement pendant ces 6 étapes —
// masqué sur Compte / Aperçu de la valeur / Activation (géré par le parent).
export function Stepper({ current }: { current: number }) {
  return (
    <div className="w-full">
      <div className="hidden items-center md:flex">
        {STEP_LABELS.map((label, i) => {
          const done = i < current;
          const isCurrent = i === current;
          return (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-[.68rem] font-bold transition-all ${
                    done
                      ? "border-transparent text-white"
                      : isCurrent
                        ? "border-brand text-brand"
                        : "border-border text-muted"
                  }`}
                  style={done ? { background: "var(--brand-gradient)" } : undefined}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-sm font-semibold transition-colors ${
                    isCurrent ? "text-ink" : done ? "text-ink-2" : "text-muted"
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <span className={`mx-3 h-0.5 flex-1 rounded-full transition-colors ${done ? "bg-brand" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="md:hidden">
        <p className="text-sm font-semibold text-ink-2">
          Étape {current + 1}/{STEP_LABELS.length}
        </p>
      </div>
    </div>
  );
}
