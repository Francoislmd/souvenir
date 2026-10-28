import v from "@/components/gallery/vente.module.css";

/**
 * L'en-tête de la galerie privée : le prestataire, son lieu, et le cadenas
 * du paiement sécurisé. Rien d'autre : sur la page où l'on paie, un lien de
 * plus est une raison de douter.
 */
export function SaleHeader({ operatorName, logoUrl, place }: { operatorName: string; logoUrl?: string | null; place?: string | null }) {
  return (
    <header className={v.top}>
      <div className={`${v.wrap} ${v.topIn}`}>
        <div className={v.who}>
          <span className={v.logo}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" />
            ) : (
              operatorName.slice(0, 2).toUpperCase()
            )}
          </span>
          <span className={v.whoText}>
            <strong>{operatorName}</strong>
            <span>{place ?? "Galerie privée"}</span>
          </span>
        </div>
        <span className={v.secure} title="Paiement sécurisé">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2.5" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span className={v.secureLabel}>Paiement sécurisé</span>
        </span>
      </div>
    </header>
  );
}
