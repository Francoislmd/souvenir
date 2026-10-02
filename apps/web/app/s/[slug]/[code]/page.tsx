import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { resolveOperator } from "@/lib/store";
import { formatDayFr } from "@/lib/format";
import { LinkRequest } from "@/components/store/LinkRequest";
import styles from "@/components/gallery/collective.module.css";

// Le lien du QR code affiché à la fin de la sortie. Il ne montre rien : il
// inscrit l'adresse du client à cette sortie et lui envoie sa galerie privée.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const found = await resolveOperator(params.slug);
  return {
    title: found ? `Vos photos · ${found.name}` : "Vos photos",
    robots: { index: false, follow: false },
  };
}

export default async function StoreSortiePage({ params }: { params: { slug: string; code: string } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();
  const code = params.code.trim().toLowerCase();
  const sortie = await prisma.sortie.findFirst({
    where: { operatorId: operator.id, shareCode: code, mode: "GROUPE" },
    select: { activity: true, startsAt: true },
  });
  if (!sortie) notFound();

  const day = formatDayFr(sortie.startsAt);
  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <LinkRequest
        slug={operator.slug}
        code={code}
        operator={operator}
        heading="Vos photos de la sortie"
        lead={`${sortie.activity}, ${day.charAt(0).toLowerCase()}${day.slice(1)}. Votre lien personnel arrive par e-mail.`}
      />
    </div>
  );
}
