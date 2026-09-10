import { getOperatorGroupDays } from "@/lib/gallery-group";
import { publicStorePath, apiStoreBase, type StoreOperator } from "@/lib/store";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import { Logo } from "@/components/brand/Logo";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/collective.module.css";

/**
 * La boutique d'un opérateur, servie à deux adresses : store.linktrip.co/{slug}
 * pour l'entrée générale, et .../{slug}/{code} quand on arrive par le QR code
 * d'une sortie précise, qui ne fait qu'ouvrir la boutique sur le bon jour.
 *
 * Un seul composant pour les deux, sinon les deux écrans divergent au premier
 * changement.
 */
export async function StoreScreen({ operator, initialDateKey }: { operator: StoreOperator; initialDateKey?: string }) {
  const data = await getOperatorGroupDays(operator.slug);

  const frame = (children: React.ReactNode) => (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} />
      {children}
      <div className={gallery.powered}>
        Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
      </div>
    </div>
  );

  // Aucune sortie publiée : un client qui scanne le QR code en sortant de
  // l'eau arrive souvent avant que les photos soient en ligne. Lui servir un
  // 404 lui ferait croire que son lien est mauvais.
  if (!data || data.days.length === 0) {
    return frame(
      <div className={gallery.head}>
        <h1>Les photos ne sont pas encore en ligne</h1>
        <p className={gallery.hint}>Elles arrivent ici après la sortie. Rouvrez ce lien plus tard, il reste valable.</p>
      </div>,
    );
  }

  return frame(
    <GroupGallery
      basePath={publicStorePath(operator.slug)}
      apiBase={apiStoreBase(operator.slug)}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      days={data.days}
      initialDateKey={initialDateKey}
      pricing={{ pricePhotoCents: operator.pricePhotoCents, priceAllCents: operator.priceAllCents }}
      packOnly={operator.packOnly}
    />,
  );
}
