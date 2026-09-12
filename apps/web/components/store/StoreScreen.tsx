import { getOperatorGroupDays, getSortieSlots, type GroupSlotSummary } from "@/lib/gallery-group";
import { publicStorePath, apiStoreBase, type StoreOperator } from "@/lib/store";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import { Logo } from "@/components/brand/Logo";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/collective.module.css";

/**
 * La boutique d'un opérateur, servie à deux adresses : store.linktrip.co/{slug}
 * pour l'entrée générale, qui commence par le choix du jour, et
 * .../{slug}/{code} pour le lien d'une sortie précise, qui n'affiche que ses
 * créneaux. La distinction compte : un même jour peut porter plusieurs
 * sorties du même opérateur, et le QR code d'une sortie ne doit pas ouvrir
 * celles d'à côté.
 *
 * Un seul composant pour les deux, sinon les deux écrans divergent au premier
 * changement.
 */
export async function StoreScreen({ operator, sortieId }: { operator: StoreOperator; sortieId?: string }) {
  const sortie: { dateLabel: string; slots: GroupSlotSummary[] } | null = sortieId ? await getSortieSlots(sortieId) : null;
  const data = sortieId ? null : await getOperatorGroupDays(operator.slug);

  // Le pied de page n'est posé ici que sur l'écran d'attente : GroupGallery
  // pose déjà le sien, et l'enveloppe en ajoutait un second, visible en
  // production.
  const frame = (children: React.ReactNode) => (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      {/* Le logo ramène à l'accueil de la boutique — l'entrée générale, même
          quand on est arrivé par le lien d'une sortie précise. */}
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} href={publicStorePath(operator.slug)} />
      {children}
    </div>
  );

  // Aucune sortie publiée : un client qui scanne le QR code en sortant de
  // l'eau arrive souvent avant que les photos soient en ligne. Lui servir un
  // 404 lui ferait croire que son lien est mauvais.
  if (sortieId ? !sortie : !data || data.days.length === 0) {
    return frame(
      <>
        <div className={gallery.head}>
          <h1>Les photos ne sont pas encore en ligne</h1>
          <p className={gallery.hint}>Elles arrivent ici après la sortie. Rouvrez ce lien plus tard, il reste valable.</p>
        </div>
        <div className={gallery.powered}>
          Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
        </div>
      </>,
    );
  }

  return frame(
    <GroupGallery
      basePath={publicStorePath(operator.slug)}
      apiBase={apiStoreBase(operator.slug)}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      days={data?.days ?? []}
      sortie={sortie ?? undefined}
      pricing={{ pricePhotoCents: operator.pricePhotoCents, priceAllCents: operator.priceAllCents }}
      packOnly={operator.packOnly}
    />,
  );
}
