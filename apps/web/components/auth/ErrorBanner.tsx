import styles from "./auth.module.css";

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className={styles.banner} role="alert" aria-live="polite">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2.2" strokeLinecap="round" style={{ flex: "0 0 auto", marginTop: 1 }}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6M12 16.5v.5" />
      </svg>
      <div>{message}</div>
    </div>
  );
}
