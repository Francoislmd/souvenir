"use client";

import { useState, type FormEvent } from "react";
import { ReviewSection } from "./ReviewSection";
import { InstagramShareSection } from "./InstagramShareSection";

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
  hashtags: string[];
  initialEmail: string | null;
}

export function MarketingCtas({ token, operator, hashtags, initialEmail }: MarketingCtasProps) {
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

  return (
    <div className="flex flex-col gap-4">
      {/* Section Instagram */}
      {operator.instagramHandle ? (
        <InstagramShareSection
          token={token}
          operator={{
            name: operator.name,
            instagramHandle: operator.instagramHandle,
            instagramPostCaption: operator.instagramPostCaption,
          }}
          hashtags={hashtags}
        />
      ) : null}

      {/* Section avis multi-plateformes */}
      <ReviewSection
        token={token}
        operatorName={operator.name}
        googleReviewUrl={operator.googleReviewUrl}
        trustpilotUrl={operator.trustpilotUrl}
        tripadvisorUrl={operator.tripadvisorUrl}
      />

      {/* Capture email */}
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
