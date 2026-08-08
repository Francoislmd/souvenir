"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(marketing)/landing.module.css";
import { trackEvent } from "@/lib/marketing-analytics";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export function EmailCaptureField() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, website, source: "hero" }),
      });
      if (!res.ok) throw new Error("waitlist submit failed");
      trackEvent("hero_email_submit");
      router.push(`/liste-attente?email=${encodeURIComponent(email)}`);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className={styles.field} onSubmit={handleSubmit}>
        <label htmlFor="hero-email" className="sr-only">
          E-mail professionnel
        </label>
        <input
          id="hero-email"
          type="email"
          required
          placeholder="Votre e-mail professionnel"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={styles.hp} aria-hidden="true">
          <label htmlFor="hero-website">Ne pas remplir</label>
          <input id="hero-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={cx(
            "flex-shrink-0 rounded-full px-6 text-[15px] font-semibold text-white transition disabled:opacity-60",
            "bg-ink shadow-[0_8px_22px_-8px_rgba(22,19,32,0.5)] hover:bg-[#2A2438]",
          )}
          style={{ paddingTop: "clamp(12px, 1.7vh, 15px)", paddingBottom: "clamp(12px, 1.7vh, 15px)" }}
        >
          {submitting ? "…" : "Être prévenu"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">Une erreur est survenue, réessayez.</p>}
    </>
  );
}

export default EmailCaptureField;
