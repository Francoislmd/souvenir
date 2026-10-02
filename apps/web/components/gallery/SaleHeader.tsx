import styles from "@/components/gallery/sale.module.css";

/**
 * L'en-tête de la galerie privée : le prestataire, et le cadenas du
 * paiement sécurisé, toujours visible. Rien d'autre : sur la page où l'on
 * paie, un lien de plus est une raison de douter.
 */
export function SaleHeader({ operatorName, logoUrl }: { operatorName: string; logoUrl?: string | null }) {
  return (
    <div className={styles.top}>
      <div className={styles.topIn}>
        <span className={styles.topLogo}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            operatorName.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className={styles.topName}>{operatorName}</span>
        <span className={styles.lock}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <em>Paiement sécurisé</em>
        </span>
      </div>
    </div>
  );
}
