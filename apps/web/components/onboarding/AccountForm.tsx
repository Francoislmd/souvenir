"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { isAcceptable, isEmail, MIN_LENGTH } from "@/lib/auth/password-strength";
import { PasswordField } from "@/components/auth/PasswordField";
import { StrengthMeter } from "@/components/auth/StrengthMeter";
import { Spinner } from "@/components/ui/Spinner";
import styles from "./onboarding.module.css";

/*
 * Premier écran de l'inscription : une adresse et un mot de passe, comme à
 * la connexion.
 *
 * Si le projet Supabase demande de confirmer l'adresse, signUp ne rend pas de
 * session. Au lieu de l'ancien « Vérifiez vos emails » qui envoyait le pro
 * dans sa boîte puis sur un autre formulaire, on lui demande ici le code du
 * même e-mail (verifyOtp, type « signup ») : il reste dans l'onglet. L'e-mail
 * ne contient que le code, aucun lien (modèle docs/email-supabase-confirm-signup.html).
 */

const NETWORK = "Le réseau a coupé, réessayez dans une minute.";

function describe(err: { status?: number; message: string; code?: string }): string {
  const status = err.status ?? 0;
  if (err.code === "user_already_exists" || err.message === "User already registered") return "exists";
  if (status === 429) return "Trop de tentatives. Réessayez dans quelques minutes.";
  // Une panne côté Supabase (402 quota, 5xx) doit se dire : sinon on la
  // cherche des heures du côté du formulaire.
  if (status >= 500 || status === 402) {
    console.error("[signup] panne côté Supabase", err);
    return "Le service est momentanément indisponible. Réessayez dans quelques minutes.";
  }
  if (status === 0) return NETWORK;
  return err.message;
}

export function AccountForm({ initialEmail, onSignedIn }: { initialEmail: string; onSignedIn: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!isEmail(address)) {
      setError("Cette adresse ne semble pas complète.");
      return;
    }
    if (!isAcceptable(password)) {
      setError(`Choisissez un mot de passe d'au moins ${MIN_LENGTH} caractères, qui ne soit pas un mot courant.`);
      return;
    }
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email: address,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (err) {
      setError(describe(err));
      return;
    }
    if (data.session) {
      onSignedIn();
      return;
    }
    // Adresse déjà confirmée : Supabase répond comme si de rien n'était, sans
    // envoyer d'e-mail (anti-énumération), mais avec identities vide. Sans ce
    // test, le pro attend un code qui n'arrivera jamais.
    if (data.user && data.user.identities?.length === 0) {
      setError("exists");
      return;
    }
    setSentTo(address);
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(token: string): Promise<void> {
    if (!sentTo || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email: sentTo, token, type: "signup" });
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

  const exists = error === "exists";

  if (sentTo) {
    return (
      <div className={styles.scr}>
        <h1>Confirmez votre adresse.</h1>
        <p className={styles.lede}>
          Nous avons envoyé un code à <b>{sentTo}</b>. Entrez-le ici pour activer votre compte.
        </p>
        <input
          ref={codeRef}
          id="obCode"
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
                const { error: err } = await createClient().auth.resend({ type: "signup", email: sentTo });
                if (err) setError(describe(err));
                else setResent(true);
              }}
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                setSentTo(null);
                setCode("");
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
    <form className={styles.scr} onSubmit={(e) => void submit(e)} noValidate>
      <h1>Créez votre compte Linktrip.</h1>
      <p className={styles.lede}>Ensuite, votre structure, votre page et votre première sortie.</p>
      <label className={styles.lbl} htmlFor="obEmail">
        Votre adresse e-mail
      </label>
      <input
        id="obEmail"
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
      <div className={styles.pwWrap}>
        <PasswordField label="Choisissez un mot de passe" value={password} onChange={setPassword} autoComplete="new-password">
          <StrengthMeter password={password} />
        </PasswordField>
      </div>
      {exists ? (
        <p className={styles.err}>
          Un compte existe déjà avec cette adresse. <Link href="/connexion">Connectez-vous</Link>.
        </p>
      ) : error ? (
        <p className={styles.err}>{error}</p>
      ) : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Création du compte" /> : null}
          {busy ? "Création…" : "Créer mon compte"}
        </button>
        <p className={styles.legal}>
          En continuant, vous acceptez les <Link href="/cgu">CGU</Link>, les <Link href="/cgv">CGV</Link> et la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </div>
    </form>
  );
}
