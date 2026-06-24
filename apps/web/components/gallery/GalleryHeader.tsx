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

  return (
    <div>
      {/* Bande opérateur */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo */}
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ring-2 ring-accent"
          style={{ background: "var(--accent-tint)", color: "var(--accent)" }}
        >
          {operator.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={operator.logoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{operator.name}</p>
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

      {/* Zone titre — dégradé subtil */}
      <div
        className="px-4 pb-5 pt-1"
        style={{
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 9%, transparent) 0%, transparent 100%)",
        }}
      >
        <h1 className="font-display text-[1.75rem] font-extrabold leading-tight text-ink">
          {heroTitle}
        </h1>
        <p className="mt-1.5 text-xs text-ink-2">
          {[location, sessionDate, mediaLabel].filter(Boolean).join(" · ")}
        </p>
      </div>

      <div className="h-px bg-border" />
    </div>
  );
}
