"use client";

import { useId, useState } from "react";
import styles from "./auth.module.css";

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  forgotHref,
  inputRef,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  forgotHref?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  /** Contenu additionnel affiché dans le même bloc .field — ex. StrengthMeter. */
  children?: React.ReactNode;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsOn, setCapsOn] = useState(false);

  return (
    <div className={styles.field}>
      <div className={styles.lrow}>
        <label htmlFor={id}>{label}</label>
        <span className={styles.sp} />
        {forgotHref ? (
          <a href={forgotHref} className={styles.lrowLink}>
            Oublié ?
          </a>
        ) : null}
      </div>
      <div className={styles.wrapf}>
        <input
          ref={inputRef}
          id={id}
          className={`${styles.inp} ${styles.pw}`}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => {
            if (e.getModifierState) setCapsOn(e.getModifierState("CapsLock"));
          }}
          onBlur={() => setCapsOn(false)}
        />
        <button
          className={styles.eye}
          type="button"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="m3 3 18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M9.4 5.4A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.6 4.5M6.5 6.6A16.6 16.6 0 0 0 2 12s3.6 7 10 7c1.2 0 2.2-.2 3.2-.5" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {capsOn ? (
        <div className={styles.caps}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 4 8 8h-5v5H9v-5H4z" />
            <path d="M9 20h6" />
          </svg>
          Verrouillage majuscules activé
        </div>
      ) : null}
      {children}
    </div>
  );
}
