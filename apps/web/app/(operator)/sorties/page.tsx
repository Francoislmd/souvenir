import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { publicationStatus } from "@/lib/sorties";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { SortiesHeader } from "@/components/sorties/SortiesHeader";
import { SortiesList, type SortieRow } from "@/components/sorties/SortiesList";
import styles from "@/app/(operator)/operator.module.css";

export default async function SortiesPage() {
  const dbUser = await requireOperatorUser();
  const now = new Date();

  const [sorties, lastSortie] = await Promise.all([
    prisma.sortie.findMany({
      where: { operatorId: dbUser.operatorId },
      orderBy: { startsAt: "desc" },
      take: 100,
      include: {
        _count: { select: { participants: true, photos: true } },
        participants: { include: { order: true } },
      },
    }),
    // Le mode de réception est une habitude de métier : on reprend celui de
    // la dernière sortie créée plutôt que de reposer la question à chaque
    // fois. Sans sortie précédente, la feuille pose la question une fois.
    prisma.sortie.findFirst({
      where: { operatorId: dbUser.operatorId },
      orderBy: { createdAt: "desc" },
      select: { mode: true },
    }),
  ]);

  const rows: SortieRow[] = sorties.map((s) => {
    const paid = s.participants.filter((p) => p.order?.status === "succeeded");
    return {
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      activity: s.activity,
      place: s.place,
      guide: s.guide,
      participantCount: s._count.participants,
      photoCount: s._count.photos,
      paidCount: paid.length,
      isGroup: s.mode === "GROUPE",
      revenueCents: paid.reduce((sum, p) => sum + (p.order?.amountCents ?? 0), 0),
      publicationStatus: publicationStatus(s._count.photos, s.status),
    };
  });

  const selectedIds = new Set(dbUser.operator.activities);
  const activities = (selectedIds.size > 0 ? ACTIVITIES.filter((a) => selectedIds.has(a.id)) : ACTIVITIES).map((a) => a.label);

  return (
    <>
      <SortiesHeader activities={activities} mode={lastSortie?.mode ?? null} />
      <div className={styles.sWrap}>
        <SortiesList rows={rows} now={now.toISOString()} />
      </div>
    </>
  );
}
