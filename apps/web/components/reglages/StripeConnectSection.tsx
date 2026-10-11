"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { StripeOnboarding } from "@/components/stripe/StripeOnboarding";

/**
 * L'état de Stripe dans Réglages. Connecté : une ligne dans « Paiements et
 * reçus ». Pas encore connecté : posé en tête de page par ReglagesForm, car
 * c'est le seul réglage sans lequel rien ne se vend. Le formulaire Stripe
 * s'ouvre ici même, comme à l'inscription : plus de départ vers stripe.com ni
 * de retour à deviner.
 */
export function StripeConnectSection({ stripeOnboarded }: { stripeOnboarded: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (stripeOnboarded) {
    return (
      <div className={styles.rgList}>
        <div className={styles.rgRow}>
          <span className={styles.rgOkIc}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
          <span className={styles.rgRowMain}>
            <b>Stripe connecté</b>
            <span>Virement sur votre compte le vendredi.</span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.rgList}>
      <div className={styles.rgRow}>
        <span className={styles.rgRowMain}>
          <b>{pending ? "Stripe attend encore des informations" : "Connectez Stripe pour encaisser vos ventes"}</b>
          <span>
            {pending
              ? "Stripe a encore besoin d'informations, ou vérifie celles que vous avez données."
              : "Sans lui, vos galeries s'ouvrent mais personne ne peut payer."}
          </span>
        </span>
        {open ? null : (
          <button
            type="button"
            className={`${styles.sBtn} ${styles.sBtnInk} ${styles.sBtnSm}`}
            onClick={() => {
              setPending(false);
              setOpen(true);
            }}
          >
            {pending ? "Reprendre" : "Connecter Stripe"}
          </button>
        )}
      </div>
      {open ? (
        <div className={styles.rgStripe}>
          <StripeOnboarding
            onDone={(ready) => {
              setOpen(false);
              if (ready) router.refresh();
              else setPending(true);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
