export function GalleryHeader({
  operator,
  location,
  sessionDate,
  heroTitle,
  photoCount,
  videoCount,
  instagramHandle,
  hashtags,
}: {
  operator: { name: string; logoUrl: string | null };
  location: string | null;
  sessionDate: string;
  heroTitle: string;
  photoCount: number;
  videoCount: number;
  instagramHandle?: string | null;
  hashtags?: string[];
}) {
  const initials = operator.name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-4 pt-6">
      {/* Avatar + infos opérateur */}
      <div className="flex items-center gap-4">
        {/* Avatar avec anneau accent Souvenir */}
        <span className="shrink-0 rounded-full p-[2.5px]" style={{ background: "var(--accent)" }}>
          <span className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border-[3px] border-surface bg-canvas">
            {operator.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={operator.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold" style={{ color: "var(--accent)" }}>{initials}</span>
            )}
          </span>
        </span>

        {/* Nom + lieu + badge @handle */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{operator.name}</p>
          <p className="truncate text-xs text-ink-2">
            {location ? `${location} · ` : ""}
            {sessionDate}
          </p>
          {instagramHandle ? (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1.5 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold transition hover:bg-accent-tint"
              style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2.2" />
                <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
              </svg>
              @{instagramHandle}
            </a>
          ) : null}
        </div>

        {/* Stats : photos / vidéos façon profil IG */}
        <div className="shrink-0 flex gap-5 text-center">
          {photoCount > 0 ? (
            <div>
              <p className="text-lg font-bold leading-none text-ink">{photoCount}</p>
              <p className="mt-0.5 text-[10px] text-muted">{photoCount === 1 ? "photo" : "photos"}</p>
            </div>
          ) : null}
          {videoCount > 0 ? (
            <div>
              <p className="text-lg font-bold leading-none text-ink">{videoCount}</p>
              <p className="mt-0.5 text-[10px] text-muted">{videoCount === 1 ? "vidéo" : "vidéos"}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Séparateur */}
      <div className="mt-4 h-px bg-border" />

      {/* Titre */}
      <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink">{heroTitle}</h1>

      {/* Hashtags en pills accent */}
      {hashtags && hashtags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
