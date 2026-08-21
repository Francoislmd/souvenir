"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(marketing)/landing.module.css";
import { trackEvent, type MarketingEventName } from "@/lib/marketing-analytics";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export interface EmailCaptureFieldProps {
  /** Origine enregistrée en base, pour savoir quel bloc a converti. */
  source?: string;
  /** Préfixe des `id` : deux champs sur la même page sinon collision de label. */
  idPrefix?: string;
  /** Événement analytics émis à la soumission. */
  event?: MarketingEventName;
  /** Habillage du formulaire ; par défaut la pilule claire du hero. */
  formClassName?: string;
  /** Habillage du bouton ; fourni, il remplace entièrement le style par défaut. */
  buttonClassName?: string;
  submitLabel?: string;
}

export function EmailCaptureField({
  source = "hero",
  idPrefix = "hero",
  event = "hero_email_submit",
  formClassName,
  buttonClassName,
  submitLabel = "Rejoindre la liste d'attente",
}: EmailCaptureFieldProps = {}) {
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
        body: JSON.stringify({ email, website, source }),
      });
      if (!res.ok) throw new Error("waitlist submit failed");
      trackEvent(event);
      router.push(`/liste-attente?email=${encodeURIComponent(email)}`);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className={formClassName ?? styles.field} onSubmit={handleSubmit}>
        <label htmlFor={`${idPrefix}-email`} className="sr-only">
          E-mail professionnel
        </label>
        <input
          id={`${idPrefix}-email`}
          type="email"
          required
          placeholder="Votre e-mail professionnel"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className={styles.hp} aria-hidden="true">
          <label htmlFor={`${idPrefix}-website`}>Ne pas remplir</label>
          <input id={`${idPrefix}-website`} type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className={
            buttonClassName ??
            cx(
              "flex-shrink-0 whitespace-nowrap rounded-full px-5 text-[13.5px] font-semibold text-white transition disabled:opacity-60",
              "bg-ink shadow-[0_8px_22px_-8px_rgba(22,19,32,0.5)] [@media(hover:hover)]:hover:bg-[#2A2438]",
            )
          }
          style={buttonClassName ? undefined : { paddingTop: "clamp(12px, 1.7vh, 15px)", paddingBottom: "clamp(12px, 1.7vh, 15px)" }}
        >
          {submitting ? "…" : (
            <>
              {submitLabel} <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">Une erreur est survenue, réessayez.</p>}
    </>
  );
}

export default EmailCaptureField;
