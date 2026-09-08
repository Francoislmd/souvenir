import styles from "@/components/gallery/gallery.module.css";

/**
 * Le logo du prestataire et son nom. Rien d'autre.
 *
 * La version précédente posait ici quatre liens de navigation — « Nos
 * sorties / Mes photos / Tarifs / Aide » — un bouton compte et un panier.
 * Aucun ne menait nulle part : ce produit n'a ni pages secondaires ni compte
 * client. Sur la page où quelqu'un s'apprête à taper son numéro de carte,
 * des liens morts ne sont pas de l'encombrement, c'est un problème de
 * confiance.
 */
export function GalleryHeader({ operatorName, logoUrl }: { operatorName: string; logoUrl?: string | null }) {
  return (
    <div className={styles.top}>
      <div className={styles.topIn}>
        <span className={styles.logo}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" />
          ) : (
            operatorName.slice(0, 2).toUpperCase()
          )}
        </span>
        <span className={styles.name}>{operatorName}</span>
      </div>
    </div>
  );
}
