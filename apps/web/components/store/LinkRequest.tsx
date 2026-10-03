"use client";

import { useState } from "react";
import styles from "@/components/gallery/sale.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/brand/Logo";

/** Les fautes de frappe les plus courantes sur les domaines d'e-mail français. */
const DOMAIN_FIX: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gnail.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.fr": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmial.fr": "hotmail.fr",
  "hotmal.fr": "hotmail.fr",
  "hotmail.f": "hotmail.fr",
  "outlok.fr": "outlook.fr",
  "outlook.f": "outlook.fr",
  "yahou.fr": "yahoo.fr",
  "yaho.fr": "yahoo.fr",
  "orange.f": "orange.fr",
  "wanado.fr": "wanadoo.fr",
  "icloud.fr": "icloud.com",
};

/** Un numéro plausible : des chiffres, avec espaces, points ou tirets, et un + éventuel. */
function looksLikePhone(value: string): boolean {
  return !value.includes("@") && /^[+\d][\d\s.()-]{7,20}$/.test(value.trim());
}

function suggestFix(mail: string): string | null {
  const [user, domain] = mail.split("@");
  if (!user || !domain) return null;
  const fixed = DOMAIN_FIX[domain.toLowerCase()];
  return fixed ? `${user}@${fixed}` : null;
}

export interface RecentSortie {
  href: string;
  activity: string;
  /** « 26 » */
  dayNumber: string;
  /** « sept » */
  month: string;
  /** « Samedi » */
  weekday: string;
  /** « 10 h », ou « 9 h, 11 h, 14 h » pour plusieurs départs */
  hours: string;
  photoCount: number;
}

export interface Teaser {
  count: number;
  /** Vignettes très floutées (Photo.blurEmailKey) : on devine une sortie, on ne reconnaît personne. */
  urls: string[];
}

/**
 * La page du QR de fin de sortie, et celle de la boutique. Elles ne montrent
 * aucune photo : le client donne l'adresse de sa réservation et, si elle est
 * sur la liste, reçoit le lien de SA galerie.
 * Maquette validée le 03/10/2026 : docs/maquette-page-vente-v2.html.
 *
 * Trois choses que la page d'une course Finisher Memories ne fait pas :
 * elle corrige les fautes de frappe avant l'envoi, elle aide quand
 * l'adresse est inconnue, et elle dit quel mail chercher.
 */
export function LinkRequest({
  slug,
  code,
  operator,
  place,
  eyebrow,
  heading,
  teaser,
  guide,
  mailSubject,
  recent,
}: {
  slug: string;
  /** Le code de la sortie, quand on arrive par son QR code. */
  code?: string;
  operator: { name: string; logoUrl: string | null; coverUrl: string | null };
  /** Sous le nom du prestataire, sur la couverture. */
  place?: string | null;
  /** « Canyoning · samedi 26 septembre » */
  eyebrow?: string | null;
  heading: string;
  teaser?: Teaser | null;
  guide?: string | null;
  /** L'objet exact du mail qui part, pour que le client le trouve. */
  mailSubject?: string | null;
  /** Page de la boutique : les dernières sorties en ligne, pour reconnaître la sienne. */
  recent?: RecentSortie[];
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<"idle" | "typo" | "unknown" | "error" | "sent" | "pending">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState("");
  // L'objet exact du mail parti, quand le serveur le connaît mieux que la page
  // (boutique : une galerie ou un mail qui les regroupe toutes).
  const [sentSubject, setSentSubject] = useState<string | null>(null);
  const [sentBy, setSentBy] = useState<"email" | "sms">("email");

  async function send(raw: string, skipTypo = false): Promise<void> {
    const to = raw.trim().toLowerCase();
    if (!to || busy) return;
    if (!to.includes("@") && !looksLikePhone(to)) {
      setState("error");
      setErrorText("Entrez une adresse e-mail ou un numéro de téléphone.");
      return;
    }
    if (!skipTypo && suggestFix(to)) {
      setEmail(to);
      setState("typo");
      return;
    }
    setBusy(true);
    setErrorText(null);
    try {
      const res = await fetch(`/api/store/${slug}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: to, ...(code ? { code } : {}) }),
      });
      if (!res.ok) {
        setState("error");
        setErrorText(
          res.status === 429
            ? "Trop de demandes. Réessayez dans quelques minutes."
            : res.status === 400
              ? "Cette adresse ou ce numéro ne semble pas valide."
              : "L'envoi n'a pas abouti. Réessayez.",
        );
        return;
      }
      const { outcome, subject, via } = (await res.json()) as { outcome: "sent" | "pending" | "no_match"; subject?: string; via?: "email" | "sms" };
      setSentSubject(subject ?? null);
      setSentBy(via === "sms" ? "sms" : "email");
      if (outcome === "no_match") {
        setEmail(to);
        setState("unknown");
        return;
      }
      setSentTo(to);
      setState(outcome);
    } catch {
      setState("error");
      setErrorText("Le réseau a coupé. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const fixed = state === "typo" ? suggestFix(email) : null;
  const done = state === "sent" || state === "pending";
  const askWho = guide ? `demandez à ${guide}, votre guide` : `demandez à ${operator.name}`;
  const wall = teaser && teaser.urls.length >= 3 ? Array.from({ length: 9 }, (_, i) => teaser.urls[i % teaser.urls.length]!) : null;

  const logo = (
    <span className={styles.orgLogo}>
      {operator.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={operator.logoUrl} alt="" />
      ) : (
        operator.name.slice(0, 2).toUpperCase()
      )}
    </span>
  );
  const org = (
    <span className={styles.org}>
      <b>{operator.name}</b>
      {place ? <span>{place}</span> : null}
    </span>
  );

  return (
    <div className={styles.accessPage}>
      {operator.coverUrl ? (
        <div className={styles.cover} style={{ backgroundImage: `url(${operator.coverUrl})` }}>
          <div className={styles.coverIn}>
            {logo}
            {org}
          </div>
        </div>
      ) : null}

      <div className={`${styles.sheet} ${operator.coverUrl ? "" : styles.bare}`}>
        <div className={styles.sheetIn}>
          <div className={`${styles.access} ${wall ? styles.hasWall : ""}`}>
            {wall ? (
              <div className={styles.wall} aria-hidden="true">
                {wall.map((url, i) => (
                  <i key={i} style={{ backgroundImage: `url(${url})`, backgroundPosition: `${15 + ((i * 23) % 70)}% ${30 + ((i * 17) % 50)}%` }} />
                ))}
                <b className={styles.display}>
                  {teaser!.count} photo{teaser!.count > 1 ? "s vous attendent" : " vous attend"}
                  <span>Privées : seul votre lien les ouvre</span>
                </b>
              </div>
            ) : null}

            {operator.coverUrl ? null : (
              <div className={styles.bareOrg}>
                {logo}
                {org}
              </div>
            )}
            {eyebrow ? <div className={styles.eyebrow}>{eyebrow}</div> : null}
            <h1 className={`${styles.h1} ${styles.display}`}>{heading}</h1>
            {recent ? <p className={styles.intro}>Le lien de chacune de vos sorties vous arrive par e-mail.</p> : null}

            {teaser && teaser.count > 0 && teaser.urls.length > 0 ? (
              <div className={styles.teaser}>
                <div className={styles.blur} aria-hidden="true">
                  {teaser.urls.slice(0, 4).map((url, i) => (
                    <span key={i}>
                      <i style={{ backgroundImage: `url(${url})` }} />
                    </span>
                  ))}
                  {teaser.count > 4 ? <span className={styles.more}>+{teaser.count - Math.min(4, teaser.urls.length)}</span> : null}
                </div>
                <p>
                  <b>
                    {teaser.count} photo{teaser.count > 1 ? "s" : ""}
                  </b>{" "}
                  prise{teaser.count > 1 ? "s" : ""} pendant la sortie. Privée{teaser.count > 1 ? "s" : ""} : seul votre lien {teaser.count > 1 ? "les ouvre" : "l\u2019ouvre"}.
                </p>
              </div>
            ) : null}

            {done ? (
              <div className={styles.done} role="status">
                <h2 className={styles.display}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  {state === "sent" ? "Votre lien est parti" : "Vous êtes sur la liste"}
                </h2>
                <p>
                  {state === "sent" ? (
                    <>
                      {sentBy === "sms" ? "Envoyé par SMS au" : "Envoyé à"} <b>{sentTo}</b>. Il ouvre vos photos sur ce téléphone ou un autre, pendant 90 jours.
                    </>
                  ) : (
                    <>
                      Vos photos ne sont pas encore prêtes. Votre lien partira à <b>{sentTo}</b> dès qu&rsquo;elles le seront.
                    </>
                  )}
                </p>
                <div className={styles.mail}>
                  <span>{sentBy === "sms" ? "Cherchez ce SMS" : "Cherchez ce mail"}</span>
                  <b>{operator.name}</b>
                  {sentBy === "email" && (sentSubject ?? mailSubject) ? <span>{sentSubject ?? mailSubject}</span> : null}
                </div>
                {state === "sent" && sentBy === "email" ? <div className={styles.doneRow}>Rien après une minute ? Regardez dans les spams.</div> : null}
                <div className={styles.doneRow}>
                  <button
                    type="button"
                    className={styles.lnk}
                    onClick={() => {
                      setState("idle");
                      setEmail("");
                    }}
                  >
                    Utiliser une autre adresse
                  </button>
                </div>
              </div>
            ) : (
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(email);
                }}
              >
                {state === "unknown" ? (
                  <div className={styles.msgErr} role="alert">
                    <b>{email.includes("@") ? "Cette adresse n\u2019est pas" : "Ce numéro n\u2019est pas"} sur la liste {code ? "de la sortie" : "de nos sorties"}.</b>
                    <p>
                      {email.includes("@") ? "Essayez votre numéro de téléphone, ou l\u2019adresse" : "Essayez votre adresse e-mail, ou le numéro"} d&rsquo;une autre personne de votre groupe qui a pu réserver. Sinon, {askWho}.
                    </p>
                  </div>
                ) : null}
                <label className={styles.label} htmlFor="link-email">
                  L&rsquo;e-mail ou le téléphone donné à la réservation
                </label>
                <input
                  id="link-email"
                  className={`${styles.input} ${state === "unknown" ? styles.inputBad : ""}`}
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="prenom.nom@gmail.com ou 06 12 34 56 78"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state !== "idle") setState("idle");
                  }}
                />
                {fixed ? (
                  <div className={styles.suggest}>
                    Vous vouliez dire{" "}
                    <button
                      type="button"
                      className={styles.lnk}
                      onClick={() => {
                        setEmail(fixed);
                        void send(fixed, true);
                      }}
                    >
                      {fixed}
                    </button>{" "}
                    ?{" "}
                    <button type="button" className={styles.lnk} onClick={() => void send(email, true)}>
                      Non, garder la mienne
                    </button>
                  </div>
                ) : null}
                {state === "error" && errorText ? (
                  <p className={styles.msgErr} role="alert">
                    {errorText}
                  </p>
                ) : null}
                <button type="submit" className={styles.cta} disabled={busy}>
                  {busy ? <Spinner size={17} tone="light" /> : null}
                  Recevoir mon lien
                </button>
              </form>
            )}

            <div className={styles.facts}>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Paiement sécurisé
              </span>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="10" r="1.6" />
                  <path d="m21 16-5-5-9 8" />
                </svg>
                Pleine résolution
              </span>
              <span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v12m-5-5 5 5 5-5M5 21h14" />
                </svg>
                Téléchargement immédiat
              </span>
            </div>
            {recent && recent.length > 0 ? (
              <nav className={styles.recent} aria-label="Sorties récentes">
                <h2>Sorties récentes</h2>
                <ul>
                  {recent.map((s) => (
                    <li key={s.href}>
                      <a href={s.href}>
                        <span className={styles.date}>
                          <b>{s.dayNumber}</b>
                          {s.month}
                        </span>
                        <span className={styles.what}>
                          <b>{s.activity}</b>
                          <span>
                            {s.weekday} · {s.hours} · {s.photoCount} photo{s.photoCount > 1 ? "s" : ""}
                          </span>
                        </span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m9 6 6 6-6 6" />
                        </svg>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>
          <div className={styles.foot}>
            <span className={styles.powered}>
              Propulsé par <Logo variant="wordmark" tone="mono" height={12} title="Linktrip" />
            </span>
            <a href="/cgv">Conditions de vente</a>
          </div>
        </div>
      </div>
    </div>
  );
}
