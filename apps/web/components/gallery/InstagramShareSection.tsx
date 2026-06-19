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

export function InstagramShareSection({ token, operator, hashtags }: InstagramShareSectionProps) {
  async function handleShare(): Promise<void> {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ig_share_clicked" }),
    });

    const text = renderInstagramCaption(operator.instagramPostCaption, {
      instagramHandle: operator.instagramHandle,
      operatorName: operator.name,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // annulé
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    window.open(`https://instagram.com/${operator.instagramHandle}`, "_blank");
  }

  return (
    <div
      className="overflow-hidden rounded-card border shadow-card"
      style={{ borderColor: "var(--accent)", background: "var(--accent-tint)" }}
    >
      <div className="px-4 py-4">
        {/* Titre */}
        <div className="flex items-center gap-2">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--accent)" }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white">
              <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2.2" />
              <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-bold text-ink">Partage l&apos;aventure !</p>
            <p className="text-xs text-ink-2">Mentionne-nous dans ta story ou ton post</p>
          </div>
        </div>

        {/* @handle + hashtags */}
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://instagram.com/${operator.instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-bold transition hover:opacity-80"
            style={{ borderColor: "var(--accent)", color: "var(--accent)", background: "var(--surface)" }}
          >
            @{operator.instagramHandle}
          </a>
          {hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border px-2.5 py-1 text-xs font-medium text-ink-2"
              style={{ borderColor: "var(--border)" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bouton */}
        <button
          type="button"
          onClick={handleShare}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-white shadow-sm transition active:scale-[0.98]"
          style={{ background: "var(--accent)" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2.2" />
            <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
          </svg>
          Partager sur Instagram
        </button>
      </div>
    </div>
  );
}
