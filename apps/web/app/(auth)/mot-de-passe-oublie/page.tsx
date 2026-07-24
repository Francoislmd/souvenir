"use client";

import { useState } from "react";
import { EmailField } from "@/components/auth/EmailField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { isEmail } from "@/lib/auth/password-strength";
import styles from "@/components/auth/auth.module.css";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!isEmail(value)) {
      setError("Cette adresse ne ressemble pas à un email.");
      return;
    }
    setError(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      if (res.status === 429) {
        setStatus("idle");
        setError("Trop de tentatives. Réessayez dans quelques minutes.");
        return;
      }
      // Réponse identique que l'adresse existe ou non — cf. brief §3.
      setSentTo(value);
      setStatus("sent");
    } catch {
      setStatus("idle");
      setError("Le réseau a coupé — réessayez.");
    }
  }

  if (status === "sent") {
    return (
      <>
        <div style={{ textAlign: "center" }}>
          <div className={styles.ring} style={{ background: "var(--soft)" }}>
            <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#E8460C" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2.5" />
              <path d="m3 7 9 6 9-6" />
            </svg>
          </div>
          <h1>Vérifiez vos emails</h1>
          <p className={styles.lead}>
            Un lien a été envoyé à <b>{sentTo}</b>. Il est valable une heure.
          </p>
        </div>
        <SubmitButton ghost type="button" onClick={() => setStatus("idle")}>
          Changer d&rsquo;adresse
        </SubmitButton>
      </>
    );
  }

  return (
    <>
      <a href="/connexion" className={styles.back}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Retour
      </a>
      <div className={styles.head}>
        <h1>Mot de passe oublié</h1>
        <p className={styles.lead}>Indiquez votre email, on vous envoie un lien pour en choisir un nouveau.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <EmailField
          label="Email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (error) setError(null);
          }}
          autoComplete="email"
          placeholder="marc@annecyvollibre.fr"
          error={error}
          autoFocus
        />
        <SubmitButton loading={status === "loading"} loadingLabel="Envoi…">
          Envoyer le lien
        </SubmitButton>
      </form>
    </>
  );
}
