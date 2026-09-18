"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Spinner } from "@/components/ui/Spinner";
import styles from "./onboarding.module.css";

/*
 * Entrer par un code reçu par e-mail : le même geste pour créer son compte
 * (/signup) et pour se reconnecter (/connexion). Pas de mot de passe, donc
 * pas de « mot de passe oublié », et l'adresse est vérifiée par le code
 * lui-même.
 *
 * `shouldCreateUser` reste vrai des deux côtés : une adresse inconnue tapée
 * sur /connexion ne tombe pas sur un refus, elle crée le compte et l'espace
 * pro renvoie vers /signup (requireOperatorUser). Aucun écran ne dit donc si
 * une adresse a déjà un compte.
 */

const NETWORK = "Le réseau a coupé, réessayez dans une minute.";

function describe(err: { status?: number; message: string }): string {
  const status = err.status ?? 0;
  if (status === 429) return "Trop de demandes. Réessayez dans quelques minutes.";
  // Une panne côté Supabase (402 quota, 5xx) doit se dire : sinon on la
  // cherche des heures du côté du formulaire.
  if (status >= 500 || status === 402) {
    console.error("[auth] panne côté Supabase", err);
    return "Le service est momentanément indisponible. Réessayez dans quelques minutes.";
  }
  if (status === 0) return NETWORK;
  return err.message;
}

export function EmailCodeForm({
  title,
  lede,
  initialEmail = "",
  withLegal = false,
  onSignedIn,
}: {
  title: string;
  lede: string;
  initialEmail?: string;
  withLegal?: boolean;
  onSignedIn: () => void;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  async function sendCode(address: string): Promise<boolean> {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(describe(err));
      return false;
    }
    return true;
  }

  async function submitEmail(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError(address.includes("@") ? "Cette adresse ne semble pas complète." : "Il manque le @ dans l'adresse.");
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await sendCode(address);
    setBusy(false);
    if (!ok) return;
    setSentTo(address);
    setCode("");
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(token: string): Promise<void> {
    if (!sentTo || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" });
    if (err) {
      setBusy(false);
      setError(
        err.status === 403 || err.status === 400 || err.status === 401
          ? "Ce code ne correspond pas, ou il a expiré. Vérifiez le dernier e-mail reçu."
          : describe(err),
      );
      return;
    }
    onSignedIn();
  }

  if (sentTo) {
    return (
      <div className={styles.scr}>
        <h1>Entrez le code reçu.</h1>
        <p className={styles.lede}>
          Envoyé à <b>{sentTo}</b>.
        </p>
        <input
          ref={codeRef}
          id="authCode"
          className={`${styles.inp} ${styles.code}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          aria-label="Code reçu par e-mail"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 8);
            setCode(v);
            // Six chiffres : la longueur réglée dans Supabase (Auth, Email OTP length).
            if (v.length === 6) void verify(v);
          }}
          disabled={busy}
        />
        {error ? <p className={styles.err}>{error}</p> : null}
        {resent && !error ? <p className={styles.info}>Un nouveau code est parti.</p> : null}
        <div className={styles.foot}>
          <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={() => void verify(code)} disabled={busy || code.length < 6}>
            {busy ? <Spinner size={16} tone="current" label="Vérification" /> : null}
            {busy ? "Vérification…" : "Valider"}
          </button>
          <p className={styles.links}>
            <button
              type="button"
              className={styles.link}
              onClick={async () => {
                setError(null);
                if (await sendCode(sentTo)) setResent(true);
              }}
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                setSentTo(null);
                setError(null);
                setResent(false);
              }}
            >
              Changer d&rsquo;adresse
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.scr} onSubmit={(e) => void submitEmail(e)} noValidate>
      <h1>{title}</h1>
      <p className={styles.lede}>{lede}</p>
      <label className={styles.lbl} htmlFor="authEmail">
        Votre adresse e-mail
      </label>
      <input
        id="authEmail"
        className={styles.inp}
        type="email"
        autoComplete="email"
        placeholder="vous@votre-structure.fr"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        autoFocus
      />
      {error ? <p className={styles.err}>{error}</p> : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Envoi du code" /> : null}
          {busy ? "Envoi…" : "Recevoir un code"}
        </button>
        {withLegal ? (
          <p className={styles.legal}>
            En continuant, vous acceptez les <Link href="/cgu">CGU</Link>, les <Link href="/cgv">CGV</Link> et la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        ) : null}
      </div>
    </form>
  );
}
