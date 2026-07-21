import { ACTIVITIES } from "@/lib/onboarding/activities";

export function StepActivities({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Quelle expérience proposez-vous ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Sélectionnez toutes vos activités. Souvenir s&apos;adapte à chacune.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {ACTIVITIES.map((a) => {
          const isSelected = selected.has(a.id);
          return (
            <button
              key={a.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(a.id)}
              className={`relative flex flex-col items-center gap-2 rounded-card border p-4 text-center transition ${
                isSelected ? "border-brand bg-brand-tint" : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              {isSelected && (
                <span
                  className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full text-white"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  <svg viewBox="0 0 24 24" fill="none" className="h-2.5 w-2.5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-control ${isSelected ? "text-white" : "bg-canvas text-ink-2"}`}
                style={isSelected ? { background: "var(--brand-gradient)" } : undefined}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: a.glyph }}
                />
              </span>
              <span className="text-sm font-semibold text-ink">{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
