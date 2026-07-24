"use client";

import { useId } from "react";
import styles from "./auth.module.css";

export function EmailField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  error,
  autoFocus,
  inputRef,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  placeholder?: string;
  error?: string | null;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        id={id}
        className={`${styles.inp} ${error ? styles.err : ""}`}
        type="email"
        inputMode="email"
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error ? (
        <div id={errorId} className={`${styles.msg} ${styles.msgErr}`} role="alert" aria-live="polite">
          {error}
        </div>
      ) : null}
    </div>
  );
}
