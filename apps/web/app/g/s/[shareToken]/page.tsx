import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGroupSlots } from "@/lib/gallery-group";
import { GroupGallery } from "@/components/gallery/GroupGallery";
import styles from "./collective.module.css";

// Page publique, non authentifiée, protégée par le shareToken non devinable
// — doit toujours refléter les derniers créneaux publiés et les derniers
// prix/couleur choisis dans Réglages (même raison que la boutique
// individuelle). Le header X-Robots-Tag: noindex est posé par
// next.config.mjs sur /g/s/:path*, et la balise meta ici (brief §5.1).
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

function formatDateFr(d: Date): string {
  return d
    .toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^./, (c) => c.toUpperCase());
}

export default async function GroupGalleryPage({ params }: { params: { shareToken: string } }) {
  const sortie = await prisma.sortie.findUnique({
    where: { shareToken: params.shareToken },
    include: { operator: true },
  });
  if (!sortie || sortie.mode !== "GROUPE") notFound();

  const data = await getGroupSlots(params.shareToken);
  if (!data) notFound();

  const operator = sortie.operator;

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <GroupGallery
        shareToken={params.shareToken}
        operatorName={operator.name}
        logoUrl={operator.logoUrl}
        activity={data.activity}
        place={sortie.place}
        sortieDateLabel={formatDateFr(sortie.startsAt)}
        slots={data.slots}
        pricing={{
          pricePhotoCents: operator.pricePhotoCents,
          pricePackCents: operator.pricePackCents,
          priceAllCents: operator.priceAllGroupCents,
          packSize: operator.packSize,
        }}
      />
    </div>
  );
}
