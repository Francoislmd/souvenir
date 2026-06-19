"use client";

import { useState, type FormEvent } from "react";
import { ReviewLink } from "./ReviewLink";
import { actionCardClass, ActionCardContent } from "./ActionCard";
import { renderInstagramCaption } from "@/lib/message-templates";

interface MarketingCtasProps {
  token: string;
  operator: {
    name: string;
    googleReviewUrl: string | null;
    trustpilotUrl: string | null;
    tripadvisorUrl: string | null;
    instagramHandle: string | null;
    instagramPostCaption: string | null;
  };
  initialEmail: string | null;
}

export function MarketingCtas({ token, operator, initialEmail }: MarketingCtasProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [consentEmail, setConsentEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`/api/gallery/${token}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consentEmail }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  async function handleShare(): Promise<void> {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "ig_share_clicked" }),
    });

    if (!operator.instagramHandle) return;

    const text = renderInstagramCaption(operator.instagramPostCaption, {
      instagramHandle: operator.instagramHandle,
      operatorName: operator.name,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // l'utilisateur a annulé — on continue sur le fallback
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    window.open(`https://instagram.com/${operator.instagramHandle}`, "_blank");
  }

  const reviewPlatforms: Array<{
    href: string;
    platform: "google" | "trustpilot" | "tripadvisor";
    label: string;
    icon: React.ReactNode;
  }> = [];

  if (operator.googleReviewUrl) {
    reviewPlatforms.push({
      href: operator.googleReviewUrl,
      platform: "google",
      label: "Google",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ),
    });
  }

  if (operator.trustpilotUrl) {
    reviewPlatforms.push({
      href: operator.trustpilotUrl,
      platform: "trustpilot",
      label: "Trustpilot",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      ),
    });
  }

  if (operator.tripadvisorUrl) {
    reviewPlatforms.push({
      href: operator.tripadvisorUrl,
      platform: "tripadvisor",
      label: "TripAdvisor",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <circle cx="7" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="17" cy="13" r="3" stroke="currentColor" strokeWidth="1.6" />
          <path
            d="M2 9s2-1 5-1 7 2 7 2 3-2 5-2M9.5 6.5 12 4l2.5 2.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    });
  }

  const hasReviews = reviewPlatforms.length > 0;
  const hasInstagram = !!operator.instagramHandle;

  return (
    <div className="flex flex-col gap-4">
      {hasReviews || hasInstagram ? (
        <div className="flex flex-col gap-3">
          {hasReviews ? (
            <p className="text-sm font-semibold text-ink">Laisser un avis</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            {reviewPlatforms.map(({ href, platform, label, icon }) => (
              <ReviewLink key={platform} token={token} href={href} platform={platform} className={actionCardClass}>
                <ActionCardContent icon={icon} label={label} />
              </ReviewLink>
            ))}
            {hasInstagram ? (
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
            ) : null}
          </div>
        </div>
      ) : null}

      <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 rounded-card border border-border bg-canvas p-4">
        <p className="text-sm font-semibold text-ink">Reçois tout par email</p>
        <input
          type="email"
          required
          placeholder="ton@email.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
        <label className="flex items-start gap-2 text-xs text-ink-2">
          <input
            type="checkbox"
            checked={consentEmail}
            onChange={(event) => setConsentEmail(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0"
          />
          <span>J&apos;accepte de recevoir des emails de {operator.name}.</span>
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-11 rounded-control bg-ink text-sm font-semibold text-white transition disabled:opacity-60"
        >
          {status === "saved" ? "Envoyé ✓" : status === "loading" ? "Envoi…" : "Recevoir par email"}
        </button>
        {status === "error" ? <p className="text-center text-xs text-danger">Le réseau a coupé — réessaie.</p> : null}
      </form>
    </div>
  );
}
