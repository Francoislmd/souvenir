import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { getSortiesKpis } from "@/lib/metrics";
import { publicationStatus } from "@/lib/sorties";
import { SortiesHeader } from "@/components/sorties/SortiesHeader";
import { SortiesKpis } from "@/components/sorties/SortiesKpis";
import { SortiesList, type SortieRow } from "@/components/sorties/SortiesList";
import styles from "@/app/(operator)/operator.module.css";

export default async function SortiesPage() {
  const dbUser = await requireOperatorUser();
  const now = new Date();

  const [sorties, kpis] = await Promise.all([
    prisma.sortie.findMany({
      where: { operatorId: dbUser.operatorId },
      orderBy: { startsAt: "desc" },
      take: 100,
      include: {
        _count: { select: { participants: true, photos: true } },
        participants: { include: { order: true } },
      },
    }),
    getSortiesKpis(dbUser.operatorId, now),
  ]);

  const rows: SortieRow[] = sorties.map((s) => ({
    id: s.id,
    startsAt: s.startsAt.toISOString(),
    activity: s.activity,
    place: s.place,
    guide: s.guide,
    participantCount: s._count.participants,
    photoCount: s._count.photos,
    revenueCents: s.participants.reduce(
      (sum, p) => sum + (p.order?.status === "succeeded" ? p.order.amountCents : 0),
      0,
    ),
    publicationStatus: publicationStatus(s._count.photos, s.status),
  }));

  return (
    <>
      <SortiesHeader />
      <div className={styles.sWrap}>
        <SortiesKpis kpis={kpis} now={now} />
        <SortiesList rows={rows} now={now.toISOString()} />
      </div>
    </>
  );
}
