import { ReviewLink } from "./ReviewLink";

const STAR = (
  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3 text-amber-400">
    <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43.94-5.49-4-3.9 5.53-.8L10 1.5Z" />
  </svg>
);
const STARS = <span className="flex gap-px">{STAR}{STAR}{STAR}{STAR}{STAR}</span>;

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" fill="#EA4335" />
  </svg>
);

const TrustpilotIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden fill="#00B67A">
    <path d="M12 1.5L9.22 8.41 1.5 9.27l5.6 4.88L5.4 21.5 12 17.82l6.6 3.68-1.7-7.35 5.6-4.88-7.72-.86L12 1.5Z" />
  </svg>
);

const TripAdvisorIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
    <circle cx="7" cy="13" r="3.5" fill="#34E0A1" />
    <circle cx="17" cy="13" r="3.5" fill="#34E0A1" />
    <circle cx="7" cy="13" r="1.5" fill="#fff" />
    <circle cx="17" cy="13" r="1.5" fill="#fff" />
    <path d="M2.5 9.5s1.5-1 4.5-1 7 1.5 7 1.5 2.5-1.5 4.5-1.5M10 7l2-2.5L14 7" stroke="#34E0A1" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-muted">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function ReviewSection({
  token,
  operatorName,
  googleReviewUrl,
  trustpilotUrl,
  tripadvisorUrl,
}: {
  token: string;
  operatorName: string;
  googleReviewUrl: string | null;
  trustpilotUrl: string | null;
  tripadvisorUrl: string | null;
}) {
  const platforms: Array<{
    href: string;
    platform: "google" | "trustpilot" | "tripadvisor";
    label: string;
    icon: React.ReactNode;
  }> = [];

  if (googleReviewUrl) platforms.push({ href: googleReviewUrl, platform: "google", label: "Google", icon: <GoogleIcon /> });
  if (trustpilotUrl)  platforms.push({ href: trustpilotUrl,  platform: "trustpilot",  label: "Trustpilot", icon: <TrustpilotIcon /> });
  if (tripadvisorUrl) platforms.push({ href: tripadvisorUrl, platform: "tripadvisor", label: "TripAdvisor", icon: <TripAdvisorIcon /> });

  if (platforms.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Titre */}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-ink">Tu as aimé l&apos;expérience ?</p>
        <p className="mt-0.5 text-xs text-ink-2">30 secondes pour aider {operatorName}</p>
      </div>

      {/* Rows */}
      {platforms.map(({ href, platform, label, icon }, i) => (
        <ReviewLink
          key={platform}
          token={token}
          href={href}
          platform={platform}
          className={`flex w-full items-center gap-3 px-4 py-3 transition hover:bg-canvas active:bg-canvas ${
            i === 0 ? "border-t border-border" : "border-t border-border"
          }`}
        >
          {icon}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">{label}</p>
            <div className="flex items-center gap-1 mt-0.5">
              {STARS}
              <span className="text-[11px] text-muted">Laisser un avis</span>
            </div>
          </div>
          <ChevronRight />
        </ReviewLink>
      ))}
    </div>
  );
}
