"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { StripeOnboarding } from "@/components/stripe/StripeOnboarding";

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/**
 * Le formulaire Stripe s'ouvre ici même, comme à l'inscription : plus de
 * départ vers stripe.com ni de retour à deviner.
 */
export function StripeConnectSection({ stripeOnboarded }: { stripeOnboarded: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (stripeOnboarded) {
    return (
      <div className={styles.rgFoot}>
        <span className={styles.rgFootIc}>
          <CheckIcon />
        </span>
        <span className={styles.rgFootText}>Paiements actifs · virement le vendredi</span>
      </div>
    );
  }

  return (
    <>
      <div className={styles.rgFoot}>
        <span className={styles.rgFootText}>
          {pending
            ? "Stripe a encore besoin d'informations, ou vérifie celles que vous avez données."
            : "Connectez Stripe pour encaisser vos ventes. Sans lui, vos galeries s'ouvrent mais personne ne peut payer."}
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
    </>
  );
}
