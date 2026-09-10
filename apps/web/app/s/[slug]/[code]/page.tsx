import { notFound } from "next/navigation";
import { getSortieSlots } from "@/lib/gallery-group";
import { resolveStore, publicStorePath, apiStoreBase } from "@/lib/store";
import { GalleryHeader } from "@/components/gallery/GalleryHeader";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import { Logo } from "@/components/brand/Logo";
import gallery from "@/components/gallery/gallery.module.css";
import styles from "@/components/gallery/collective.module.css";

// Page publique, non authentifiée. L'adresse réelle est
// store.linktrip.co/{slug}/{code} ; ce chemin /s/... est ce que Next voit
// après la réécriture d'hôte de middleware.ts, qui pose aussi le
// X-Robots-Tag: noindex. Doit toujours refléter les derniers créneaux
// publiés et les derniers prix/couleur choisis dans Réglages (même raison
// que la boutique individuelle).
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function StoreSortiePage({ params }: { params: { slug: string; code: string } }) {
  const store = await resolveStore(params.slug, params.code);
  if (!store) notFound();

  // Sortie créée mais pas encore publiée : aucun créneau. Un client qui scanne
  // le QR code en sortant de l'eau arrive souvent avant que les photos soient
  // en ligne, et lui servir le 404 de Next lui ferait croire que son lien est
  // mauvais. Il voit donc la marque de son prestataire et la raison de
  // l'attente. Le code fait six caractères tirés au hasard : ce que cet écran
  // révèle de plus qu'un 404 ne vaut pas le lien cassé qu'il évite.
  const data = await getSortieSlots(store.sortie.id);
  if (!data) {
    return (
      <div className={styles.page} style={{ "--op": store.operator.brandColor } as React.CSSProperties}>
        <GalleryHeader operatorName={store.operator.name} logoUrl={store.operator.logoUrl} />
        <div className={gallery.head}>
          <h1>Les photos ne sont pas encore en ligne</h1>
          <p className={gallery.hint}>Elles arrivent ici après la sortie. Rouvrez ce lien plus tard, il reste valable.</p>
        </div>
        <div className={gallery.powered}>
          Propulsé par <Logo variant="wordmark" tone="mono" height={13} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page} style={{ "--op": store.operator.brandColor } as React.CSSProperties}>
      <GalleryHeader operatorName={store.operator.name} logoUrl={store.operator.logoUrl} />
      <GroupGallery
        basePath={publicStorePath(store.operator.slug, params.code.toLowerCase())}
        apiBase={apiStoreBase(store.operator.slug, params.code.toLowerCase())}
        appUrl={process.env.NEXT_PUBLIC_APP_URL ?? ""}
        dateLabel={data.dateLabel}
        slots={data.slots}
        pricing={{
          pricePhotoCents: store.operator.pricePhotoCents,
          priceAllCents: store.operator.priceAllCents,
        }}
        packOnly={store.operator.packOnly}
      />
    </div>
  );
}
