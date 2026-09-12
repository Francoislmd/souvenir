import Link from "next/link";
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
 *
 * `href` est le seul lien admis, et il ne vaut que pour la boutique de
 * groupe : le logo ramène à son accueil, comme sur n'importe quel site.
 * La galerie individuelle (`/g/[token]`) n'a pas d'accueil — un client y
 * arrive par son propre lien — et son en-tête reste donc muet.
 */
export function GalleryHeader({ operatorName, logoUrl, href }: { operatorName: string; logoUrl?: string | null; href?: string }) {
  const inside = (
    <>
      <span className={styles.logo}>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" />
        ) : (
          operatorName.slice(0, 2).toUpperCase()
        )}
      </span>
      <span className={styles.name}>{operatorName}</span>
    </>
  );

  return (
    <div className={styles.top}>
      {href ? (
        <Link href={href} className={styles.topIn} aria-label={`${operatorName} — accueil de la boutique`}>
          {inside}
        </Link>
      ) : (
        <div className={styles.topIn}>{inside}</div>
      )}
    </div>
  );
}
