"use client";

import { useState } from "react";
import styles from "@/components/gallery/store.module.css";
import gallery from "@/components/gallery/gallery.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/brand/Logo";

/**
 * L'adresse de la boutique et celle du QR code de fin de sortie. Elles ne
 * montrent plus aucune photo : le client donne son e-mail et, s'il figure
 * sur la liste de la sortie, reçoit le lien de SA galerie.
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
  const [busy, setBusy] = useState(false);
  // Comme sur la page d'une course chez Finisher Memories : le formulaire
  // reste en place, et un bandeau dit ce qui s'est passé juste au-dessus.
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: React.ReactNode } | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    const to = email.trim();
    if (!to || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/store/${slug}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: to, ...(code ? { code } : {}) }),
      });
      if (res.status === 429) {
        setResult({ tone: "error", text: "Trop de demandes. Réessayez dans quelques minutes." });
        return;
      }
      if (res.status === 400) {
        setResult({ tone: "error", text: "Cette adresse ne semble pas valide." });
        return;
      }
      if (!res.ok) {
        setResult({ tone: "error", text: "L'envoi n'a pas abouti. Réessayez." });
        return;
      }
      const { outcome } = (await res.json()) as { outcome: "sent" | "pending" | "no_match" };
      if (outcome === "no_match") {
        setResult({
          tone: "error",
          text: code
            ? "Aucune photo de cette sortie ne correspond à cette adresse. Utilisez bien l'adresse donnée à la réservation."
            : "Aucune sortie ne correspond à cette adresse. Utilisez bien l'adresse donnée à la réservation.",
        });
        return;
      }
      setDone(true);
      setResult({
        tone: "ok",
        text:
          outcome === "sent" ? (
            <>
              Votre lien personnel vient de partir à <strong>{to}</strong>. Consultez votre boîte de réception.
            </>
          ) : (
            <>
              Votre adresse est bien sur la liste. Vos photos ne sont pas encore prêtes : votre lien partira à <strong>{to}</strong> dès qu&rsquo;elles le seront.
            </>
          ),
      });
    } catch {
      setResult({ tone: "error", text: "Le réseau a coupé. Réessayez." });
    } finally {
      setBusy(false);
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

        <div className={styles.label}>
          <h2>{heading}</h2>
          <p>{lead}</p>
          {result ? (
            <p className={`${styles.linkAlert} ${result.tone === "ok" ? styles.linkAlertOk : styles.linkAlertErr}`} role={result.tone === "ok" ? "status" : "alert"}>
              {result.text}
            </p>
          ) : null}
          {done ? (
            <button
              type="button"
              className={styles.linkAgain}
              onClick={() => {
                setDone(false);
                setResult(null);
                setEmail("");
              }}
            >
              Utiliser une autre adresse
            </button>
          ) : (
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
              <button type="submit" className={gallery.cta} disabled={busy || !email.trim()}>
                {busy ? <Spinner size={17} tone="light" /> : null}
                Recevoir mon lien
              </button>
            </form>
          )}
          <p className={styles.linkNote}>Nous vérifions que votre adresse figure sur la liste de la sortie. Aucune photo n&rsquo;est visible sans votre lien.</p>
        </div>
      </div>

      <div className={gallery.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
    </>
  );
}
