import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { operatorVars } from "@/lib/color";
import { resolveOperator } from "@/lib/store";
import { getPreviewUrl } from "@/lib/storage";
import { formatDayFr, photosOf } from "@/lib/format";
import { LinkRequest, type Teaser } from "@/components/store/LinkRequest";
import styles from "@/components/gallery/collective.module.css";

// Le lien du QR code affiché à la fin de la sortie. Il ne montre aucune
// photo : si l'adresse saisie est sur la liste de la sortie, la galerie
// privée de ce client lui est envoyée.
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
    select: { id: true, activity: true, place: true, guide: true, startsAt: true, status: true },
  });
  if (!sortie) notFound();

  // Donner envie sans rien montrer : le nombre de photos et quelques
  // vignettes très floutées (celles des e-mails), une fois la sortie en ligne.
  let teaser: Teaser | null = null;
  if (sortie.status === "SENT") {
    const visible = { sortieId: sortie.id, hiddenAt: null, status: { not: "FAILED" as const } };
    const [count, blurred] = await Promise.all([
      prisma.photo.count({ where: visible }),
      prisma.photo.findMany({ where: { ...visible, blurEmailKey: { not: null } }, select: { blurEmailKey: true }, orderBy: { createdAt: "asc" }, take: 9 }),
    ]);
    if (count > 0) teaser = { count, urls: blurred.map((p) => getPreviewUrl(p.blurEmailKey!)) };
  }

  const day = formatDayFr(sortie.startsAt);
  const mailDate = sortie.startsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

  return (
    <div className={styles.page} style={operatorVars(operator.brandColor)}>
      <LinkRequest
        slug={operator.slug}
        code={code}
        operator={operator}
        place={sortie.place ?? operator.tagline}
        eyebrow={`${sortie.activity} · ${day.charAt(0).toLowerCase()}${day.slice(1)}`}
        heading="Vos photos de la sortie"
        teaser={teaser}
        guide={sortie.guide}
        mailSubject={`Vos photos ${photosOf(sortie.activity)} du ${mailDate}`}
      />
    </div>
  );
}
