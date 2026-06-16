export function GalleryHeader({
  operator,
  location,
  sessionDate,
  heroTitle,
  photoCount,
  videoCount,
}: {
  operator: { name: string; logoUrl: string | null };
  location: string | null;
  sessionDate: string;
  heroTitle: string;
  photoCount: number;
  videoCount: number;
}) {
  const initials = operator.name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3">
        <span className="rounded-full p-[2px]" style={{ background: "var(--accent)" }}>
          <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 border-surface bg-canvas">
            {operator.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={operator.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold text-accent">{initials}</span>
            )}
          </span>
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{operator.name}</p>
          <p className="truncate text-xs text-ink-2">
            {location ? `${location} · ` : ""}Vol biplace · {sessionDate}
          </p>
        </div>
      </div>

      <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink">{heroTitle}</h1>

      <div className="mt-2 flex items-center gap-3 text-sm text-ink-2">
        {photoCount > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path
                d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l.6-1.2A1.5 1.5 0 0 1 9.45 5h5.1a1.5 1.5 0 0 1 1.35.8L16.5 7h2A1.5 1.5 0 0 1 20 8.5v8A1.5 1.5 0 0 1 18.5 18h-13A1.5 1.5 0 0 1 4 16.5v-8Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            {photoCount} photo{photoCount > 1 ? "s" : ""}
          </span>
        ) : null}
        {videoCount > 0 ? (
          <span className="inline-flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <rect x="3" y="6" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
              <path d="M16 10.5 21 7.5v9l-5-3v-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            {videoCount} vidéo{videoCount > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}
