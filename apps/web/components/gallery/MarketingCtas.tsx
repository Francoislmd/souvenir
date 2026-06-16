"use client";

import { useState, type FormEvent } from "react";
import { ReviewLink } from "./ReviewLink";
import { actionCardClass, ActionCardContent } from "./ActionCard";

interface MarketingCtasProps {
  token: string;
  operator: {
    name: string;
    googleReviewUrl: string | null;
    instagramHandle: string | null;
  };
  initialEmail: string | null;
}

export function MarketingCtas({ token, operator, initialEmail }: MarketingCtasProps) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [consentEmail, setConsentEmail] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");

  function trackClick(name: "ig_share_clicked"): void {
    void fetch(`/api/gallery/${token}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  }

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
    trackClick("ig_share_clicked");
    if (!operator.instagramHandle) return;

    const text = `Mon vol avec @${operator.instagramHandle} 🪂✨`;

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

  return (
    <div className="flex flex-col gap-4">
      {operator.googleReviewUrl || operator.instagramHandle ? (
        <div className="flex gap-3">
          {operator.googleReviewUrl ? (
            <ReviewLink token={token} href={operator.googleReviewUrl} className={actionCardClass}>
              <ActionCardContent
                icon={
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                    <path
                      d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
                label="Laisser un avis"
              />
            </ReviewLink>
          ) : null}
          {operator.instagramHandle ? (
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
