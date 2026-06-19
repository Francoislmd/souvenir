// Gradient signature Instagram Stories — reconnaissable immédiatement.
const IG_GRADIENT = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

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

  const ringStyle = instagramHandle
    ? { background: IG_GRADIENT }
    : { background: "var(--accent)" };

  return (
    <div className="px-4 pt-6">
      {/* Avatar + infos opérateur */}
      <div className="flex items-center gap-3">
        <span className="shrink-0 rounded-full p-[2.5px]" style={ringStyle}>
          <span className="flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-full border-[3px] border-surface bg-canvas">
            {operator.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={operator.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-base font-bold" style={{ color: "var(--accent)" }}>{initials}</span>
            )}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{operator.name}</p>
          <p className="truncate text-xs text-ink-2">
            {location ? `${location} · ` : ""}
            {sessionDate}
          </p>
          {/* Badge @handle Instagram */}
          {instagramHandle ? (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ background: IG_GRADIENT }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3 shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
                <circle cx="17" cy="7" r="1.2" fill="currentColor" />
              </svg>
              @{instagramHandle}
            </a>
          ) : null}
        </div>

        {/* Compteurs photos / vidéos */}
        <div className="shrink-0 text-right">
          {photoCount > 0 ? (
            <p className="text-lg font-bold leading-none text-ink">{photoCount}</p>
          ) : null}
          {videoCount > 0 ? (
            <p className={`text-lg font-bold leading-none text-ink ${photoCount > 0 ? "mt-1.5" : ""}`}>{videoCount}</p>
          ) : null}
          <div className="flex flex-col items-end gap-1.5">
            {photoCount > 0 ? (
              <p className="text-[10px] text-muted leading-none">{photoCount === 1 ? "photo" : "photos"}</p>
            ) : null}
            {videoCount > 0 ? (
              <p className="text-[10px] text-muted leading-none">{videoCount === 1 ? "vidéo" : "vidéos"}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Séparateur style IG */}
      <div className="mt-4 h-px bg-border" />

      {/* Titre de la galerie */}
      <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink">{heroTitle}</h1>

      {/* Hashtags pills */}
      {hashtags && hashtags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-accent-tint px-2.5 py-0.5 text-[11px] font-semibold"
              style={{ color: "var(--accent)" }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
