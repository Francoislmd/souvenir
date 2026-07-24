import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { bucketSortie } from "@/lib/sorties";
import { formatEuros } from "@/lib/format";
import { phVariant } from "@/components/operator/PhotoPlaceholder";
import { SortieRows } from "@/components/sorties/SortieRows";
import { TodaySorties } from "@/components/sorties/TodaySorties";
import styles from "@/app/(operator)/operator.module.css";

function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
}

export default async function SortiesPage() {
  const dbUser = await requireOperatorUser();

  const sorties = await prisma.sortie.findMany({
    where: { operatorId: dbUser.operatorId },
    orderBy: { startsAt: "asc" },
    take: 100,
    include: {
      _count: { select: { participants: true } },
      participants: { include: { order: true } },
    },
  });

  const now = new Date();
  const today = sorties.filter((s) => bucketSortie(s.startsAt, now) === "today");
  const upcoming = sorties
    .filter((s) => bucketSortie(s.startsAt, now) === "upcoming")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, 8);
  const past = sorties
    .filter((s) => bucketSortie(s.startsAt, now) === "past")
    .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime())
    .slice(0, 8);

  return (
    <section className={styles.view}>
      <div className={styles.hd}>
        <h1 className={styles.h1}>Vos sorties</h1>
        <Link href="/sorties/nouvelle" className={styles.newbtn}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nouvelle
        </Link>
      </div>

      {today.length > 0 ? (
        <TodaySorties sorties={today} />
      ) : (
        <div className={styles.today}>
          <div className={styles["today-in"]} style={{ textAlign: "center", color: "var(--ink-3)", fontSize: ".88rem" }}>
            Aucune sortie aujourd&rsquo;hui.
          </div>
        </div>
      )}

      <div className={styles.lbl}>À venir</div>
      <SortieRows
        rows={upcoming.map((s, i) => ({
          id: s.id,
          title: `${s.activity}${s.place ? ` · ${s.place}` : ""}`,
          subtitle: `${formatTimeFr(s.startsAt)} · ${s._count.participants > 0 ? `${s._count.participants} inscrits sur ${s.seats}` : `${s.seats} places`}`,
          ph: phVariant(i),
          kind: "upcoming",
        }))}
        emptyLabel="Aucune sortie programmée."
      />

      <div className={styles.lbl}>Sorties précédentes</div>
      <SortieRows
        rows={past.map((s, i) => ({
          id: s.id,
          title: `${s.activity}${s.place ? ` · ${s.place}` : ""}`,
          subtitle: `${s._count.participants} participants`,
          ph: phVariant(i + 4),
          kind: "past",
          amount: formatEuros(
            s.participants.reduce((sum, p) => sum + (p.order?.status === "succeeded" ? p.order.amountCents : 0), 0),
          ),
        }))}
        emptyLabel="Aucune sortie passée."
      />
    </section>
  );
}
