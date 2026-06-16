export const actionCardClass =
  "flex flex-1 flex-col items-center gap-2 rounded-card border border-border bg-surface px-3 py-4 text-center shadow-card transition hover:border-border-strong active:scale-[0.98]";

export function ActionCardContent({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-tint text-accent">{icon}</span>
      <span className="text-xs font-semibold text-ink">{label}</span>
    </>
  );
}
