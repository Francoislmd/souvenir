import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { operatorVars } from "@/lib/color";
import { resolveOperator, publicStorePath } from "@/lib/store";
import { formatHourFr } from "@/lib/format";
import { LinkRequest, type RecentSortie } from "@/components/store/LinkRequest";
import styles from "@/components/gallery/collective.module.css";

// L'adresse de la boutique : store.linktrip.co/{slug}. Elle ne montre aucune
// photo. Le client donne l'adresse e-mail de sa réservation et reçoit le
// lien de sa galerie privée ; à côté, les dernières sorties en ligne, pour
// qu'il reconnaisse la sienne.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const found = await resolveOperator(params.slug);
  return {
    title: found ? `Vos photos · ${found.name}` : "Vos photos",
    robots: { index: false, follow: false },
  };
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();

  // Les sorties de groupe encore en ligne : l'activité, le jour, le nombre de
  // photos. Rien qui permette de voir une photo ; chaque ligne mène à la page
  // du QR de la sortie, qui pose la même question.
  const sorties = await prisma.sortie.findMany({
    where: { operatorId: operator.id, mode: "GROUPE", status: "SENT", shareCode: { not: null }, purgeAt: { gt: new Date() } },
    orderBy: { startsAt: "desc" },
    take: 5,
    select: {
      shareCode: true,
      activity: true,
      startsAt: true,
      slots: { select: { startsAt: true }, orderBy: { startsAt: "asc" } },
      _count: { select: { photos: { where: { hiddenAt: null, status: { not: "FAILED" } } } } },
    },
  });
  const recent: RecentSortie[] = sorties
    .filter((s) => s._count.photos > 0)
    .map((s) => ({
      href: publicStorePath(operator.slug, s.shareCode!),
      activity: s.activity,
      dayNumber: s.startsAt.toLocaleDateString("fr-FR", { day: "numeric", timeZone: "Europe/Paris" }),
      month: s.startsAt.toLocaleDateString("fr-FR", { month: "short", timeZone: "Europe/Paris" }).replace(".", ""),
      weekday: s.startsAt.toLocaleDateString("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).replace(/^./, (c) => c.toUpperCase()),
      // L'heure de la sortie, ou celles de ses départs s'il y en a plusieurs.
      hours: (s.slots.length > 1 ? s.slots.map((d) => d.startsAt) : [s.startsAt]).map(formatHourFr).join(", "),
      photoCount: s._count.photos,
    }));

  return (
    <div className={styles.page} style={operatorVars(operator.brandColor)}>
      <LinkRequest slug={operator.slug} operator={operator} place={operator.tagline} heading="Retrouvez vos photos" recent={recent} />
    </div>
  );
}
