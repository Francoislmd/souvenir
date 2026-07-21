import type { Bucket, Experience, GuidesAnswer } from "@/lib/onboarding/types";

const BUCKETS: Bucket[] = ["1-5", "6-15", "16-30", "30+"];
const BUCKET_LABELS: Record<Bucket, string> = { "1-5": "1–5", "6-15": "6–15", "16-30": "16–30", "30+": "30+" };
const GUIDES_OPTIONS: { id: GuidesAnswer; label: string }[] = [
  { id: "oui", label: "Oui, souvent" },
  { id: "parfois", label: "Parfois" },
  { id: "non", label: "Pas encore" },
];

export function StepExperience({
  exp,
  onChange,
}: {
  exp: Experience;
  onChange: (patch: Partial<Experience>) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Comment se déroule une expérience ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Trois réponses rapides pour calibrer Souvenir à votre rythme.
      </p>
      <div className="mt-8 flex max-w-xl flex-col gap-7">
        <QBlock question="Combien de participants par expérience, en moyenne ?">
          {BUCKETS.map((b) => (
            <Pill key={b} active={exp.group === b} onClick={() => onChange({ group: b })}>
              {BUCKET_LABELS[b]}
            </Pill>
          ))}
        </QBlock>
        <QBlock question="Combien d'expériences par semaine ?">
          {BUCKETS.map((b) => (
            <Pill key={b} active={exp.freq === b} onClick={() => onChange({ freq: b })}>
              {BUCKET_LABELS[b]}
            </Pill>
          ))}
        </QBlock>
        <QBlock question="Vos guides prennent-ils déjà des photos ?">
          {GUIDES_OPTIONS.map((g) => (
            <Pill key={g.id} active={exp.guides === g.id} onClick={() => onChange({ guides: g.id })}>
              {g.label}
            </Pill>
          ))}
        </QBlock>
      </div>
    </div>
  );
}

function QBlock({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-ink">{question}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active ? "border-brand bg-brand-tint text-brand" : "border-border bg-surface text-ink-2 hover:border-border-strong"
      }`}
    >
      {children}
    </button>
  );
}
