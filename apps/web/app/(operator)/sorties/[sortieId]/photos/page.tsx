import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { getPreviewUrl } from "@/lib/storage";
import { PhotosFlow } from "@/components/photos/PhotosFlow";
import styles from "@/app/(operator)/operator.module.css";

export default async function SortiePhotosPage({ params }: { params: { sortieId: string } }) {
  const dbUser = await requireOperatorUser();

  const sortie = await prisma.sortie.findFirst({
    where: { id: params.sortieId, operatorId: dbUser.operatorId },
    include: {
      participants: { orderBy: { createdAt: "asc" } },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!sortie) notFound();

  // La phase de départ ne peut pas se fier uniquement à sortie.status : si
  // l'opérateur a déposé des photos puis fermé l'onglet avant que le worker
  // les traite (ou avant que le navigateur déclenche /assign), la sortie
  // reste "UPCOMING" alors que des photos existent déjà — il faut reprendre
  // le suivi au lieu de réafficher un dépôt vide.
  let initialPhase: "drop" | "processing" | "lanes" | "sent" = "drop";
  if (sortie.status === "SENT") initialPhase = "sent";
  else if (sortie.status === "SORTED") initialPhase = "lanes";
  else if (sortie.photos.length > 0) initialPhase = "processing";

  return (
    <section className={styles.view}>
      <Link href={`/sorties/${sortie.id}`} className={styles.back}>
        ← Sortie
      </Link>

      <PhotosFlow
        sortieId={sortie.id}
        initialPhase={initialPhase}
        participants={sortie.participants.map((p) => ({ id: p.id, name: p.name, contact: p.contact }))}
        initialPhotos={sortie.photos.map((p) => ({
          id: p.id,
          ownerId: p.ownerId,
          thumbUrl: p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
        }))}
      />
    </section>
  );
}
