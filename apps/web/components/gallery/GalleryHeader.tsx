import styles from "@/app/g/[token]/boutique.module.css";

export function GalleryHeader({
  operatorName,
  logoUrl,
  dateLabel,
}: {
  operatorName: string;
  logoUrl?: string | null;
  dateLabel: string;
}) {
  return (
    <div className={styles.top}>
      <div className={styles["top-in"]}>
        <span className={styles.oplogo}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            operatorName.slice(0, 2).toUpperCase()
          )}
        </span>
        <div>
          <span className={styles.opname}>{operatorName}</span>
          <span className={styles.opdate}>{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
