import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { bucketSortie } from "@/lib/sorties";
import { SortieParticipantsSection } from "@/components/sorties/SortieParticipantsSection";
import styles from "@/app/(operator)/operator.module.css";

function formatMetaFr(d: Date, bucket: "today" | "upcoming" | "past"): string {
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  if (bucket === "today") return `Aujourd'hui ${time}`;
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase()) + ` · ${time}`;
}

export default async function SortieDetailPage({ params }: { params: { sortieId: string } }) {
  const dbUser = await requireOperatorUser();

  const sortie = await prisma.sortie.findFirst({
    where: { id: params.sortieId, operatorId: dbUser.operatorId },
    include: { participants: { orderBy: { createdAt: "asc" } } },
  });
  if (!sortie) notFound();

  const bucket = bucketSortie(sortie.startsAt);
  const isToday = bucket === "today";

  let btnLabel = "Les photos, après la sortie";
  let btnHref: string | null = null;
  let btnDisabled = true;
  if (isToday) {
    btnDisabled = false;
    btnHref = `/sorties/${sortie.id}/photos`;
    btnLabel = sortie.status === "SENT" ? "Voir ce que reçoit un client" : "Ajouter les photos";
  } else if (bucket === "past") {
    btnLabel = "Sortie terminée";
  }

  return (
    <section className={styles.view}>
      <Link href="/sorties" className={styles.back}>
        ← Sorties
      </Link>
      <h1 className={styles.h1}>
        {sortie.activity}
        {sortie.place ? ` · ${sortie.place}` : ""}
      </h1>
      <p className={styles.lead}>
        {formatMetaFr(sortie.startsAt, bucket)}
        {sortie.guide ? ` · guide ${sortie.guide}` : ""}
      </p>

      <div className={styles.lbl}>
        Vos clients · {sortie.participants.length} sur {sortie.seats}
      </div>

      <SortieParticipantsSection
        sortieId={sortie.id}
        participants={sortie.participants.map((p) => ({
          id: p.id,
          name: p.name,
          contact: p.contact,
          sentAt: p.sentAt ? p.sentAt.toISOString() : null,
          token: p.token,
        }))}
      />

      <div className={styles.act}>
        {btnHref ? (
          <Link href={btnHref} className={`${styles.btn} ${styles.full}`}>
            {btnLabel}
          </Link>
        ) : (
          <button type="button" className={`${styles.btn} ${styles.full}`} disabled={btnDisabled}>
            {btnLabel}
          </button>
        )}
      </div>
    </section>
  );
}
