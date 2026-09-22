"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { MailIcon, LogoutIcon } from "@/components/operator/nav-icons";

/**
 * Le compte, en bas de la colonne de gauche.
 *
 * Une version antérieure déconnectait au clic sur son propre nom ; la
 * suivante n'était plus cliquable du tout, si bien qu'on ne pouvait plus se
 * déconnecter sur ordinateur. Le clic ouvre désormais un menu, et la
 * déconnexion y est une ligne explicite.
 */
export function AccountMenu({
  operatorName,
  email,
  logoUrl,
}: {
  operatorName: string;
  email: string;
  logoUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={styles.sAcctWrap} ref={ref}>
      {open ? (
        <div className={styles.sAcctMenu} role="menu">
          <p className={styles.sAcctHead}>
            <b>{operatorName}</b>
            <span>{email}</span>
          </p>
          <a href="mailto:hello@linktrip.co" className={styles.sAcctItem} role="menuitem">
            <MailIcon size={18} />
            Nous écrire
          </a>
          <form action="/auth/signout" method="post">
            <button type="submit" className={styles.sAcctItem} role="menuitem">
              <LogoutIcon size={18} />
              Se déconnecter
            </button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        className={`${styles.sAcct} ${open ? styles.sAcctOpen : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.sAv}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            operatorName.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className={styles.sWho}>
          <b>{operatorName}</b>
          <span>{email}</span>
        </span>
        <svg className={styles.sAcctChev} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m8 10 4-4 4 4M8 14l4 4 4-4" />
        </svg>
      </button>
    </div>
  );
}
