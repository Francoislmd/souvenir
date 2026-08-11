"use client";

import { useEffect, useState } from "react";
import { CONSENT_ALL, CONSENT_NONE, readConsent, writeConsent, type ConsentState } from "@/lib/consent";
import { isGtmEnabled } from "@/lib/gtm";
import styles from "./cookie-banner.module.css";

/** Événement global : permet à un lien « Gérer mes cookies » de rouvrir le bandeau. */
export const OPEN_COOKIE_BANNER_EVENT = "linktrip:open-cookie-banner";

export function openCookieBanner(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(OPEN_COOKIE_BANNER_EVENT));
}

export function CookieBanner() {
  // Rendu uniquement après montage : le choix vit dans localStorage, donc le
  // serveur ne peut pas le connaître — l'afficher au SSR provoquerait un
  // mismatch d'hydratation et un flash du bandeau chez ceux qui ont déjà choisi.
  const [visible, setVisible] = useState(false);
  const [details, setDetails] = useState(false);
  const [draft, setDraft] = useState<ConsentState>(CONSENT_NONE);

  useEffect(() => {
    if (!isGtmEnabled) return;
    if (readConsent() === null) setVisible(true);

    function reopen(): void {
      setDraft(readConsent() ?? CONSENT_NONE);
      setDetails(true);
      setVisible(true);
    }
    window.addEventListener(OPEN_COOKIE_BANNER_EVENT, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_BANNER_EVENT, reopen);
  }, []);

  function decide(state: ConsentState): void {
    writeConsent(state);
    setVisible(false);
    setDetails(false);
  }

  if (!visible) return null;

  return (
    <div className={styles.wrap} role="dialog" aria-live="polite" aria-label="Gestion des cookies">
      <div className={styles.card}>
        <p className={styles.title}>On respecte votre vie privée</p>
        <p className={styles.text}>
          On utilise des cookies pour mesurer l&apos;audience du site et améliorer Linktrip. Rien n&apos;est déposé sans
          votre accord, et vous pouvez changer d&apos;avis à tout moment.{" "}
          <a href="/confidentialite">Politique de confidentialité</a>
        </p>

        {details ? (
          <div className={styles.panel}>
            <div className={styles.row}>
              <input id="consent-necessary" type="checkbox" checked disabled readOnly />
              <div>
                <label htmlFor="consent-necessary" className={styles.rowLabel}>
                  Strictement nécessaires
                </label>
                <p className={styles.rowHint}>
                  Connexion, panier, sécurité. Indispensables au fonctionnement du site — toujours actifs.
                </p>
              </div>
            </div>

            <div className={styles.row}>
              <input
                id="consent-analytics"
                type="checkbox"
                checked={draft.analytics}
                onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
              />
              <div>
                <label htmlFor="consent-analytics" className={styles.rowLabel}>
                  Mesure d&apos;audience
                </label>
                <p className={styles.rowHint}>
                  Google Analytics : pages vues, parcours, achats. Nous aide à savoir ce qui marche.
                </p>
              </div>
            </div>

            <div className={styles.row}>
              <input
                id="consent-ads"
                type="checkbox"
                checked={draft.ads}
                onChange={(e) => setDraft((d) => ({ ...d, ads: e.target.checked }))}
              />
              <div>
                <label htmlFor="consent-ads" className={styles.rowLabel}>
                  Publicité et personnalisation
                </label>
                <p className={styles.rowHint}>
                  Mesure de l&apos;efficacité de nos campagnes (Google Ads, réseaux sociaux).
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.actions}>
          {details ? (
            <button type="button" className={`${styles.btn} ${styles.refuse}`} onClick={() => decide(draft)}>
              Enregistrer mes choix
            </button>
          ) : (
            <button type="button" className={`${styles.btn} ${styles.refuse}`} onClick={() => decide(CONSENT_NONE)}>
              Continuer sans accepter
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.accept}`} onClick={() => decide(CONSENT_ALL)}>
            Tout accepter
          </button>
          {/* CNIL : refuser doit rester aussi simple qu'accepter — le choix
              négatif garde donc toujours un bouton dédié, jamais enfoui. */}
          {details ? (
            <button type="button" className={styles.link} onClick={() => decide(CONSENT_NONE)}>
              Tout refuser
            </button>
          ) : (
            <button type="button" className={styles.link} onClick={() => setDetails(true)}>
              Personnaliser
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
