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
      include: { _count: { select: { participants: true, photos: true } } },
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

  // Les commandes payées, et elles seules. La version précédente incluait
  // TOUS les participants de chaque sortie avec TOUTE leur commande, sur cent
  // sorties, pour n'en tirer que deux nombres : un compte et une somme. Une
  // sortie de huit personnes dont une seule achète ramenait huit lignes et
  // huit commandes au lieu d'une.
  const paidBySortie = new Map<string, { count: number; cents: number }>();
  if (sorties.length > 0) {
    const paidParticipants = await prisma.participant.findMany({
      where: { sortieId: { in: sorties.map((s) => s.id) }, order: { status: "succeeded" } },
      select: { sortieId: true, order: { select: { amountCents: true } } },
    });
    for (const p of paidParticipants) {
      const current = paidBySortie.get(p.sortieId) ?? { count: 0, cents: 0 };
      current.count += 1;
      current.cents += p.order?.amountCents ?? 0;
      paidBySortie.set(p.sortieId, current);
    }
  }

  const rows: SortieRow[] = sorties.map((s) => {
    const paid = paidBySortie.get(s.id) ?? { count: 0, cents: 0 };
    return {
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      activity: s.activity,
      place: s.place,
      guide: s.guide,
      participantCount: s._count.participants,
      photoCount: s._count.photos,
      paidCount: paid.count,
      isGroup: s.mode === "GROUPE",
      revenueCents: paid.cents,
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
