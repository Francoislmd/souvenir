import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { getSortiesKpis } from "@/lib/metrics";
import { bucketSortie, publicationStatus } from "@/lib/sorties";
import { TodaySorties } from "@/components/sorties/TodaySorties";
import { SortiesKpis } from "@/components/sorties/SortiesKpis";
import { SortiesTable, type SortieTableRow } from "@/components/sorties/SortiesTable";
import styles from "@/app/(operator)/operator.module.css";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());
}

export default async function SortiesPage() {
  const dbUser = await requireOperatorUser();
  const now = new Date();

  const [sorties, kpis] = await Promise.all([
    prisma.sortie.findMany({
      where: { operatorId: dbUser.operatorId },
      orderBy: { startsAt: "asc" },
      take: 100,
      include: {
        _count: { select: { participants: true, photos: true } },
        participants: { include: { order: true } },
      },
    }),
    getSortiesKpis(dbUser.operatorId, now),
  ]);

  const today = sorties.filter((s) => bucketSortie(s.startsAt, now) === "today");
  const rest = sorties.filter((s) => bucketSortie(s.startsAt, now) !== "today");

  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  const thisWeekCount = sorties.filter((s) => s.startsAt >= now && s.startsAt <= weekAhead).length;

  const tableRows: SortieTableRow[] = rest.map((s) => ({
    id: s.id,
    startsAt: s.startsAt,
    activity: s.activity,
    place: s.place,
    guide: s.guide,
    photoCount: s._count.photos,
    revenueCents: s.participants.reduce((sum, p) => sum + (p.order?.status === "succeeded" ? p.order.amountCents : 0), 0),
    publicationStatus: publicationStatus(s._count.photos, s.status),
  }));

  return (
    <section className={`${styles.view} ${styles.contentWide}`}>
      <div className={styles.hd}>
        <div>
          <h1 className={styles.h1}>Vos sorties</h1>
          <p className={styles.lead}>
            {formatDateFr(now)}
            {thisWeekCount > 0
              ? ` · ${thisWeekCount} sortie${thisWeekCount > 1 ? "s" : ""} programmée${thisWeekCount > 1 ? "s" : ""} cette semaine`
              : ""}
          </p>
        </div>
        <Link href="/sorties/nouvelle" className={styles.newbtn}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle sortie
        </Link>
      </div>

      <SortiesKpis kpis={kpis} />

      {today.length > 0 ? (
        <TodaySorties sorties={today} />
      ) : (
        <div className={styles.today}>
          <div className={styles["today-in"]}>
            <div className={styles.emptyToday}>
              <span className={styles.emptyTodayIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.5" />
                  <path d="M12 7.5V12l3 2" />
                </svg>
              </span>
              <div>
                <b>Aucune sortie aujourd&rsquo;hui</b>
                <p>Rien de prévu pour aujourd&rsquo;hui.</p>
              </div>
              <Link href="/sorties/nouvelle" className={styles.emptyTodayCta}>
                Programmer
              </Link>
            </div>
          </div>
        </div>
      )}

      <SortiesTable rows={tableRows} />
    </section>
  );
}
