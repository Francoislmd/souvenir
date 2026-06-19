"use client";

import { renderInstagramCaption } from "@/lib/message-templates";

const IG_GRADIENT = "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";

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
        // annulé par l'utilisateur — fallback
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    window.open(`https://instagram.com/${operator.instagramHandle}`, "_blank");
  }

  return (
    <div className="overflow-hidden rounded-card" style={{ background: IG_GRADIENT }}>
      <div className="px-4 py-5">
        {/* Titre */}
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0 text-white">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17" cy="7" r="1.2" fill="currentColor" />
          </svg>
          <p className="text-base font-bold text-white">Partage l&apos;aventure !</p>
        </div>
        <p className="mt-1 text-sm text-white/75">
          Mentionne-nous dans ta story ou ton post
        </p>

        {/* @handle + hashtags */}
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href={`https://instagram.com/${operator.instagramHandle}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/35"
          >
            @{operator.instagramHandle}
          </a>
        </div>

        {hashtags.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white/90"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {/* Bouton partager */}
        <button
          type="button"
          onClick={handleShare}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-bold shadow-lg transition active:scale-[0.98]"
          style={{ color: "#dc2743" }}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
            <circle cx="17" cy="7" r="1.2" fill="currentColor" />
          </svg>
          Partager sur Instagram
        </button>
      </div>
    </div>
  );
}
