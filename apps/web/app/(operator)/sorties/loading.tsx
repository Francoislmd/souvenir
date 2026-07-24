import styles from "@/app/(operator)/operator.module.css";

export default function Loading() {
  return (
    <div className={styles.loading}>
      <span className={styles.spinner} />
    </div>
  );
}
