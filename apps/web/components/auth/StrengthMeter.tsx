import { score, LABELS } from "@/lib/auth/password-strength";
import styles from "./auth.module.css";

const SEG_CLASS = { 0: "", 1: "s1", 2: "s2", 3: "s3", 4: "s4" } as const;

export function StrengthMeter({ password }: { password: string }) {
  const s = score(password);
  const segClass = SEG_CLASS[s];

  return (
    <>
      <div className={`${styles.meter} ${segClass ? styles[segClass] : ""}`}>
        <i />
        <i />
        <i />
        <i />
      </div>
      <div className={`${styles.hint} ${segClass ? styles[segClass] : ""}`}>
        {password ? LABELS[s] : "12 caractères ou plus, c'est le plus efficace."}
      </div>
    </>
  );
}
