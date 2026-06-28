export function GalleryHeader({
  operator,
  location,
  sessionDate,
  heroTitle,
  photoCount,
  videoCount,
  instagramHandle,
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
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const mediaLabel = [
    photoCount > 0 && `${photoCount} photo${photoCount > 1 ? "s" : ""}`,
    videoCount > 0 && `${videoCount} vidéo${videoCount > 1 ? "s" : ""}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const meta = [location, sessionDate, mediaLabel].filter(Boolean).join(" · ");

  return (
    <div className="px-4 pb-4 pt-5">
      {/* Opérateur */}
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-2 ring-accent"
          style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
        >
          {operator.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={operator.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-ink">{operator.name}</span>
          {instagramHandle && (
            <a
              href={`https://instagram.com/${instagramHandle}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ink-2 hover:underline"
            >
              @{instagramHandle}
            </a>
          )}
        </div>
      </div>

      {/* Titre */}
      <h1 className="font-display text-[1.5rem] font-extrabold leading-tight tracking-tight text-ink">
        {heroTitle}
      </h1>

      {/* Méta */}
      {meta && <p className="mt-1 text-sm text-muted">{meta}</p>}
    </div>
  );
}
