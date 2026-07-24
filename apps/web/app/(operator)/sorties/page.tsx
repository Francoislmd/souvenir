import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { bucketSortie } from "@/lib/sorties";
import { formatEuros } from "@/lib/format";
import { phVariant } from "@/components/operator/PhotoPlaceholder";
import { SortieRows } from "@/components/sorties/SortieRows";
import styles from "@/app/(operator)/operator.module.css";
import type { Sortie } from "@souvenir/db";

function formatTimeFr(d: Date): string {
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
}

type SortieWithParticipants = Sortie & {
  _count: { participants: number };
  participants: { openedAt: Date | null; order: { status: string; amountCents: number } | null }[];
};

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

  const todaySortie = today[0];

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

      {todaySortie ? (
        <TodayCard sortie={todaySortie} />
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

function TodayCard({ sortie }: { sortie: SortieWithParticipants }) {
  const regCount = sortie._count.participants;
  const showTrio = sortie.status === "SENT";

  return (
    <div className={styles.today}>
      <div className={styles["today-in"]}>
        <span className={styles.when}>Aujourd&rsquo;hui · {formatTimeFr(sortie.startsAt)}</span>
        <h2>
          {sortie.activity}
          {sortie.place ? ` · ${sortie.place}` : ""}
        </h2>
        <div className={styles.meta}>
          {sortie.guide ? `Guide ${sortie.guide} · ` : ""}
          {sortie.seats} places
        </div>

        {!showTrio ? (
          <div>
            <div className={styles.state}>
              <b>{regCount}</b>
              <span>
                client{regCount > 1 ? "s" : ""} sur {sortie.seats} places
              </span>
            </div>
            <div className={styles.track}>
              <i style={{ width: `${Math.min(100, (regCount / sortie.seats) * 100)}%` }} />
            </div>
          </div>
        ) : (
          <div className={styles.trio}>
            <div className={styles.tri}>
              <div className={styles.k}>Ont regardé</div>
              <div className={styles.v}>
                {sortie.participants.filter((p) => p.openedAt).length}/{regCount}
              </div>
            </div>
            <div className={styles.tri}>
              <div className={styles.k}>Ont acheté</div>
              <div className={styles.v}>{sortie.participants.filter((p) => p.order?.status === "succeeded").length}</div>
            </div>
            <div className={styles.tri}>
              <div className={styles.k}>Ventes</div>
              <div className={`${styles.v} ${styles.grad}`}>
                {formatEuros(sortie.participants.reduce((sum, p) => sum + (p.order?.status === "succeeded" ? p.order.amountCents : 0), 0))}
              </div>
            </div>
          </div>
        )}

        <Link href={`/sorties/${sortie.id}`} className={`${styles.btn} ${styles.full}`} style={{ marginTop: 18 }}>
          {showTrio ? "Voir où en sont les ventes" : "Voir mes clients"}
        </Link>
      </div>
    </div>
  );
}
