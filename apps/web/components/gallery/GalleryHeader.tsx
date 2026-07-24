import styles from "@/app/g/[token]/boutique.module.css";

export function GalleryHeader({ operatorName, dateLabel }: { operatorName: string; dateLabel: string }) {
  return (
    <div className={styles.top}>
      <div className={styles["top-in"]}>
        <span className={styles.oplogo}>{operatorName.slice(0, 2).toUpperCase()}</span>
        <div>
          <span className={styles.opname}>{operatorName}</span>
          <span className={styles.opdate}>{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
