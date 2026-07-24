"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmailField } from "@/components/auth/EmailField";
import { PasswordField } from "@/components/auth/PasswordField";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { ErrorBanner } from "@/components/auth/ErrorBanner";
import { isEmail } from "@/lib/auth/password-strength";
import styles from "@/components/auth/auth.module.css";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const canSubmit = isEmail(email) && password.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, remember }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Email ou mot de passe incorrect.");
        setPassword("");
        setStatus("idle");
        passwordRef.current?.focus();
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
        <h1>Bon retour</h1>
        <p className={styles.lead}>Connectez-vous pour retrouver vos sorties.</p>
      </div>

      <ErrorBanner message={error} />

      <form onSubmit={handleSubmit} noValidate>
        <EmailField
          label="Email"
          value={email}
          onChange={setEmail}
          autoComplete="username"
          placeholder="marc@annecyvollibre.fr"
          autoFocus
        />
        <PasswordField
          label="Mot de passe"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Votre mot de passe"
          forgotHref="/mot-de-passe-oublie"
          inputRef={passwordRef}
        />

        <label className={styles.remember}>
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Rester connecté sur cet appareil
        </label>

        <SubmitButton loading={status === "loading"} disabled={!canSubmit} loadingLabel="Connexion…">
          Me connecter
        </SubmitButton>
      </form>

      <div className={styles.alt}>
        Pas encore de compte ? <a href="/signup">Créer ma structure</a>
      </div>
    </>
  );
}
