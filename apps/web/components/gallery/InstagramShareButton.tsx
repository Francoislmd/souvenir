"use client";

import { actionCardClass, ActionCardContent } from "./ActionCard";
import { renderInstagramCaption } from "@/lib/message-templates";

interface InstagramShareButtonProps {
  token: string;
  operator: {
    name: string;
    instagramHandle: string;
    instagramPostCaption: string | null;
  };
}

export function InstagramShareButton({ token, operator }: InstagramShareButtonProps) {
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
        // l'utilisateur a annulé — fallback ci-dessous
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    window.open(`https://instagram.com/${operator.instagramHandle}`, "_blank");
  }

  return (
    <button type="button" onClick={handleShare} className={actionCardClass}>
      <ActionCardContent
        icon={
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="17" cy="7" r="1" fill="currentColor" />
          </svg>
        }
        label="Partager"
      />
    </button>
  );
}
