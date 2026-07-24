"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { StrengthMeter } from "@/components/auth/StrengthMeter";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import { isAcceptable } from "@/lib/auth/password-strength";
import styles from "@/components/auth/auth.module.css";

export function ReinitialiserForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = isAcceptable(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("Impossible d'enregistrer ce mot de passe — réessayez.");
        setStatus("idle");
        return;
      }
      setStatus("done");
      setTimeout(() => {
        router.push("/sorties");
        router.refresh();
      }, 700);
    } catch {
      setError("Le réseau a coupé — réessayez.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div className={styles.ring}>
          <svg width="29" height="29" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h1>Vous êtes connecté</h1>
        <p className={styles.lead}>On vous emmène à vos sorties.</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.head}>
        <h1>Nouveau mot de passe</h1>
        <p className={styles.lead}>Choisissez-en un que vous ne réutilisez nulle part ailleurs.</p>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <PasswordField
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          placeholder="Au moins 10 caractères"
        >
          <StrengthMeter password={password} />
        </PasswordField>

        <SubmitButton loading={status === "loading"} disabled={!canSubmit} loadingLabel="Enregistrement…">
          Enregistrer et me connecter
        </SubmitButton>
      </form>
    </>
  );
}
