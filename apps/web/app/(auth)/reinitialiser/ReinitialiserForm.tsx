"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { StrengthMeter } from "@/components/auth/StrengthMeter";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import { useAutofillSync } from "@/components/auth/useAutofillSync";
import { isAcceptable } from "@/lib/auth/password-strength";
import styles from "@/components/auth/auth.module.css";

export function ReinitialiserForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  useAutofillSync([{ ref: passwordRef, value: password, onChange: setPassword }]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;

    // Le gestionnaire de mots de passe en propose souvent un sans que React
    // le voie passer : on lit le champ, pas seulement l'état.
    const typedPassword = passwordRef.current?.value ?? password;
    setPassword(typedPassword);

    if (!isAcceptable(typedPassword)) {
      setError("Choisissez un mot de passe d'au moins 10 caractères, un peu moins courant.");
      passwordRef.current?.focus();
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: typedPassword }),
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
          inputRef={passwordRef}
        >
          <StrengthMeter password={password} />
        </PasswordField>

        <SubmitButton loading={status === "loading"} loadingLabel="Enregistrement…">
          Enregistrer et me connecter
        </SubmitButton>
      </form>
    </>
  );
}
