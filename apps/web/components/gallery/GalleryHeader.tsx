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

      {/* Desktop uniquement (≥821px, masqué en CSS sous ce seuil) — décoratif :
          ce produit n'a ni pages secondaires ni compte client (cf CLAUDE.md
          §3), ces liens ne mènent donc nulle part. */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
          Nos sorties
        </a>
        <a href="#" className={`${styles.navLink} ${styles.navLinkActive}`} onClick={(e) => e.preventDefault()}>
          Mes photos
        </a>
        <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
          Tarifs
        </a>
        <a href="#" className={styles.navLink} onClick={(e) => e.preventDefault()}>
          Aide
        </a>
      </nav>
      <div className={styles.actions}>
        <button type="button" className={styles.iconBtn} aria-label="Mon compte" onClick={(e) => e.preventDefault()}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="3.6" />
            <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
          </svg>
        </button>
        <button type="button" className={styles.iconBtn} aria-label="Panier" onClick={(e) => e.preventDefault()}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 7h14l-1.2 12.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8z" />
            <path d="M9 7V5.5a3 3 0 0 1 6 0V7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
