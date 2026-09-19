import Link from "next/link";
import styles from "@/app/(operator)/operator.module.css";

/**
 * L'ouverture d'une sortie montre déjà sa forme : l'en-tête avec son retour,
 * la ligne de date et une grille de vignettes qui respirent. Une moulinette
 * seule au milieu d'un écran blanc disait « ça charge » sans dire quoi ; ici
 * les photos arrivent exactement là où on les attend.
 */
export default function Loading() {
  return (
    <div role="status" aria-label="Chargement de la sortie">
      <header className={styles.sHdr}>
        <div className={styles.sHdrIn}>
          <Link href="/sorties" className={styles.sBack} aria-label="Revenir aux sorties" title="Revenir aux sorties">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14.5 5 8 12l6.5 7" />
            </svg>
          </Link>
          <span className={`${styles.sk} ${styles.skTitle}`} />
        </div>
      </header>
      <div className={styles.sWrap}>
        <span className={`${styles.sk} ${styles.skMeta}`} />
        <div className={styles.sdGrid}>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} className={`${styles.sdPh} ${styles.sk}`} style={{ animationDelay: `${i * 70}ms`, cursor: "default" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
