import styles from "./auth.module.css";

export function SubmitButton({
  loading,
  disabled,
  loadingLabel,
  children,
  ghost,
  onClick,
  type = "submit",
}: {
  loading?: boolean;
  disabled?: boolean;
  loadingLabel?: string;
  children: React.ReactNode;
  ghost?: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${ghost ? styles.ghost : ""}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? <span className={styles.sp2} /> : null}
      <span>{loading ? loadingLabel ?? children : children}</span>
    </button>
  );
}
