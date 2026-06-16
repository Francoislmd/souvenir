"use client";

import { useState, type ChangeEvent } from "react";

export function ConsentToggle({ token, initialConsent }: { token: string; initialConsent: boolean }) {
  const [consent, setConsent] = useState(initialConsent);
  const [loading, setLoading] = useState(false);

  async function handleToggle(event: ChangeEvent<HTMLInputElement>): Promise<void> {
    const value = event.target.checked;
    setConsent(value);
    setLoading(true);
    try {
      await fetch(`/api/gallery/${token}/consent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consentImage: value }),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="flex items-start gap-3 text-xs text-ink-2">
      <input type="checkbox" checked={consent} disabled={loading} onChange={handleToggle} className="mt-0.5 h-5 w-5 shrink-0" />
      <span>
        J&apos;autorise l&apos;école à réutiliser mes photos et vidéos pour sa communication. Tu peux changer
        d&apos;avis à tout moment.
      </span>
    </label>
  );
}
