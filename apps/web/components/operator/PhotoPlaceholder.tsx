import styles from "@/app/(operator)/operator.module.css";

const VARIANTS = ["ph1", "ph2", "ph3", "ph4", "ph5", "ph6", "ph7", "ph8"];

export function phVariant(seed: number): string {
  return VARIANTS[Math.abs(seed) % VARIANTS.length];
}

export function PhotoPlaceholder({ seed, className }: { seed: number; className?: string }) {
  return <span className={`${styles.th} ${styles.ph} ${styles[phVariant(seed)]} ${className ?? ""}`} />;
}
