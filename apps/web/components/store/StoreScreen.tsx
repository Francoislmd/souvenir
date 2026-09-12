import { getOperatorGroupDays, getStoreSlot } from "@/lib/gallery-group";
import { publicStorePath, apiStoreBase, type StoreOperator } from "@/lib/store";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import { Logo } from "@/components/brand/Logo";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/collective.module.css";

/**
 * La boutique d'un opérateur, à une seule adresse : store.linktrip.co/{slug}.
 * L'écran ouvert se lit dans l'URL — `?j={jour}` pour les heures de départ,
 * `?j={jour}&c={créneau}` pour une galerie — de sorte qu'un lien de galerie
 * se partage, se met en favori et se rouvre tel quel.
 *
 * C'est ici que ces deux paramètres sont vérifiés, parce que c'est le seul
 * endroit qui parle à la base : un jour qui ne correspond à aucune sortie
 * publiée, ou un créneau appartenant à une autre boutique, est ignoré et le
 * client repart de l'écran du jour.
 */
export async function StoreScreen({ operator, dateKey, slotId }: { operator: StoreOperator; dateKey?: string; slotId?: string }) {
  const data = await getOperatorGroupDays(operator.slug);
  const initial = slotId ? await getStoreSlot(operator.id, slotId) : null;

  // Le pied de page n'est posé ici que sur l'écran d'attente : GroupGallery
  // pose déjà le sien, et l'enveloppe en ajoutait un second, visible en
  // production.
  const frame = (children: React.ReactNode) => (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      {/* Le logo ramène à l'accueil de la boutique. */}
      <GalleryHeader operatorName={operator.name} logoUrl={operator.logoUrl} href={publicStorePath(operator.slug)} />
      {children}
    </div>
  );

  // Aucune sortie publiée : un client qui scanne le QR code en sortant de
  // l'eau arrive souvent avant que les photos soient en ligne. Lui servir un
  // 404 lui ferait croire que son lien est mauvais.
  if (!data || data.days.length === 0) {
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

  const day = initial?.dateKey ?? (dateKey && data.days.some((d) => d.dateKey === dateKey) ? dateKey : undefined);

  return frame(
    <GroupGallery
      basePath={publicStorePath(operator.slug)}
      apiBase={apiStoreBase(operator.slug)}
      appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
      days={data.days}
      initialDateKey={day}
      initialSlot={initial?.slot}
      initialDayLabel={initial?.dateLabel}
      pricing={{ pricePhotoCents: operator.pricePhotoCents, priceAllCents: operator.priceAllCents }}
      packOnly={operator.packOnly}
    />,
  );
}
