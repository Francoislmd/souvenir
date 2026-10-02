"use client";

import { useState } from "react";
import styles from "@/components/gallery/store.module.css";
import gallery from "@/components/gallery/gallery.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/brand/Logo";

/**
 * L'adresse de la boutique et celle du QR code de fin de sortie. Elles ne
 * montrent plus aucune photo : le client donne son e-mail et, s'il figure
 * sur la liste de la sortie, reçoit le lien de SA galerie. La réponse est la même que l'adresse soit connue ou non,
 * pour ne rien apprendre à qui essaie des adresses au hasard.
 */
export function LinkRequest({
  slug,
  code,
  operator,
  heading,
  lead,
}: {
  slug: string;
  /** Le code de la sortie, quand on arrive par son QR code. */
  code?: string;
  operator: { name: string; logoUrl: string | null; coverUrl: string | null; tagline: string };
  heading: string;
  lead: string;
}) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function send(to: string): Promise<boolean> {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/store/${slug}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to, ...(code ? { code } : {}) }),
      });
      if (res.status === 429) {
        setError("Trop de demandes. Réessayez dans quelques minutes.");
        return false;
      }
      if (!res.ok) {
        setError(res.status === 400 ? "Cette adresse ne semble pas valide." : "L'envoi n'a pas abouti. Réessayez.");
        return false;
      }
      return true;
    } catch {
      setError("Le réseau a coupé. Réessayez.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const to = email.trim();
    if (!to || busy) return;
    if (await send(to)) {
      setSentTo(to);
      setResent(false);
    }
  }

  return (
    <>
      {operator.coverUrl ? (
        <div className={styles.cover}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={operator.coverUrl} alt="" />
        </div>
      ) : null}

      <div className={`${styles.sheet} ${operator.coverUrl ? "" : styles.noCover}`}>
        <div className={styles.badge}>
          {operator.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={operator.logoUrl} alt="" />
          ) : (
            operator.name.slice(0, 2).toUpperCase()
          )}
        </div>

        <div className={styles.id}>
          <h1>{operator.name}</h1>
          {operator.tagline ? <p>{operator.tagline}</p> : null}
        </div>

        {sentTo ? (
          <div className={styles.label}>
            <h2>Regardez vos e-mails</h2>
            <p>
              Si cette adresse figure sur la liste {code ? "de la sortie" : "d'une sortie"}, votre lien est parti à <strong>{sentTo}</strong>. Il ouvre vos photos sur ce téléphone ou un autre, pendant 90 jours.
            </p>
            <div className={styles.linkActions}>
              <button
                type="button"
                disabled={busy || resent}
                onClick={() => void send(sentTo).then((ok) => ok && setResent(true))}
              >
                {busy ? <Spinner size={15} tone="current" /> : resent ? "Lien renvoyé" : "Renvoyer le lien"}
              </button>
              <button type="button" disabled={busy} onClick={() => setSentTo(null)}>
                Changer d&rsquo;adresse
              </button>
            </div>
            {error ? <p className={styles.linkError} style={{ marginTop: 10 }}>{error}</p> : null}
          </div>
        ) : (
          <div className={styles.label}>
            <h2>{heading}</h2>
            <p>{lead}</p>
            <form className={styles.linkForm} onSubmit={(e) => void onSubmit(e)}>
              <label className={styles.linkField}>
                Votre e-mail
                <input
                  className={styles.linkInput}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              {error ? <p className={styles.linkError}>{error}</p> : null}
              <button type="submit" className={gallery.cta} disabled={busy || !email.trim()}>
                {busy ? <Spinner size={17} tone="light" /> : null}
                Recevoir mon lien
              </button>
            </form>
            <p className={styles.linkNote}>Aucune photo n&rsquo;est visible sans votre lien.</p>
          </div>
        )}
      </div>

      <div className={gallery.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
    </>
  );
}
