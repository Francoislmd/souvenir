import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

export function BrandPanel({ quote, subquote }: { quote: string; subquote: string }) {
  return (
    <div className={styles.brandcol}>
      <div className={styles.top}>
        <Logo tone="white" height={40} />
      </div>
      <div className={styles.mosaic} aria-hidden="true">
        <div className={`${styles.mos} ${styles.m1}`} />
        <div className={`${styles.mos} ${styles.m2}`} />
        <div className={`${styles.mos} ${styles.m3}`} />
        <div className={`${styles.mos} ${styles.m4}`} />
      </div>
      <div className={styles.q}>{quote}</div>
      <div className={styles.qs}>{subquote}</div>
    </div>
  );
}
