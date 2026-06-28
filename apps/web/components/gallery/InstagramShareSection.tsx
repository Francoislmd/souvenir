"use client";

import { renderInstagramCaption } from "@/lib/message-templates";

interface InstagramShareSectionProps {
  token: string;
  operator: {
    name: string;
    instagramHandle: string;
    instagramPostCaption: string | null;
  };
  hashtags: string[];
}

function cleanHandle(val: string): string {
  return val
    .replace(/^https?:\/\/(www\.)?instagram\.com\/?/, "")
    .replace(/^@/, "")
    .replace(/\/$/, "")
    || val;
}

export function InstagramShareSection({ token, operator, hashtags }: InstagramShareSectionProps) {
  const handle = cleanHandle(operator.instagramHandle);

  async function handleShare(): Promise<void> {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ig_share_clicked" }),
    });

    const text = renderInstagramCaption(operator.instagramPostCaption, {
      instagramHandle: handle,
      operatorName: operator.name,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try { await navigator.share({ text }); return; } catch { /* annulé */ }
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    window.open(`https://instagram.com/${handle}`, "_blank");
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {/* Icône Instagram */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5 shrink-0 text-ink-2"
            aria-hidden
          >
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-ink">Partage l&apos;aventure</p>
            <p className="text-xs text-ink-2">Mentionne-nous dans ta story ou ton post</p>
          </div>
        </div>

        {/* Handle + hashtags */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <a
            href={`https://instagram.com/${handle}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm font-semibold text-ink transition hover:opacity-70"
          >
            @{handle}
          </a>
          {hashtags.map((tag) => (
            <span key={tag} className="text-xs text-muted">{tag}</span>
          ))}
        </div>
      </div>

      {/* Bouton */}
      <button
        type="button"
        onClick={handleShare}
        className="flex w-full items-center justify-center gap-2 border-t border-border bg-canvas py-3 text-sm font-semibold text-ink transition hover:bg-border/40 active:bg-border/60"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-ink-2" aria-hidden>
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
        </svg>
        Partager sur Instagram
      </button>
    </div>
  );
}
