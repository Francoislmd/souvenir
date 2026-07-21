import type { ReactNode } from "react";
import type { PhotoMode } from "@/lib/onboarding/types";

const OPTIONS: { id: PhotoMode; title: string; description: string; icon: ReactNode }[] = [
  {
    id: "guides",
    title: "Vos guides prennent les photos",
    description:
      "Aucun équipement supplémentaire. Les photos sont triées et organisées automatiquement pour chaque participant.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="18" height="13" rx="2.5" />
        <circle cx="12" cy="12.5" r="3.2" />
        <path d="M8 6l1.2-2h5.6L16 6" />
      </svg>
    ),
  },
  {
    id: "photographe",
    title: "Vous avez déjà un photographe",
    description: "Connectez votre flux de photos existant à Souvenir. On s'occupe du reste.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16v12H4z" />
        <path d="M9 7V5h6v2" />
        <path d="M4 11l6 3 4-2 6 3" />
      </svg>
    ),
  },
  {
    id: "unsure",
    title: "Je ne sais pas encore",
    description: "Aucun souci. On vous aidera à choisir la meilleure configuration après l'inscription.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .8-1 1.7" />
        <circle cx="12" cy="17" r=".6" fill="currentColor" />
      </svg>
    ),
  },
];

export function StepPhotoMode({ value, onChange }: { value: PhotoMode; onChange: (v: PhotoMode) => void }) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Comment capturer vos souvenirs ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Pas besoin de matériel coûteux. Choisissez ce qui colle à votre organisation.
      </p>
      <div className="mt-8 flex max-w-xl flex-col gap-3">
        {OPTIONS.map((opt) => {
          const active = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.id)}
              className={`flex items-start gap-4 rounded-card border p-5 text-left transition ${
                active ? "border-brand bg-brand-tint" : "border-border bg-surface hover:border-border-strong"
              }`}
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-control ${active ? "text-white" : "bg-canvas text-ink-2"}`}
                style={active ? { background: "var(--brand-gradient)" } : undefined}
              >
                {opt.icon}
              </span>
              <span className="flex-1">
                <span className="block font-display text-base font-bold text-ink">{opt.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-2">{opt.description}</span>
              </span>
              <span
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${active ? "border-brand" : "border-border-strong"}`}
              >
                {active && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
