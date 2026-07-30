import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOperatorGroupDays } from "@/lib/gallery-group";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import styles from "./collective.module.css";

// Page publique, non authentifiée, protégée par le shareToken non devinable
// — un seul lien par opérateur, réutilisé par toutes ses sorties GROUPE : le
// client y choisit son jour, puis son créneau. Doit toujours refléter les
// derniers créneaux publiés et les derniers prix/couleur choisis dans
// Réglages (même raison que la boutique individuelle). Le header
// X-Robots-Tag: noindex est posé par next.config.mjs sur /g/s/:path*, et la
// balise meta ici (brief §5.1).
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function GroupGalleryPage({ params }: { params: { shareToken: string } }) {
  const operator = await prisma.operator.findUnique({ where: { shareToken: params.shareToken } });
  if (!operator) notFound();

  const data = await getOperatorGroupDays(params.shareToken);
  if (!data) notFound();

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GroupGallery
        shareToken={params.shareToken}
        operatorName={operator.name}
        logoUrl={operator.logoUrl}
        days={data.days}
        pricing={{
          pricePhotoCents: operator.pricePhotoCents,
          priceAllCents: operator.priceAllCents,
        }}
        packOnly={operator.packOnly}
      />
    </div>
  );
}
