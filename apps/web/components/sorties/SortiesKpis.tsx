import styles from "@/app/(operator)/operator.module.css";
import type { SortiesKpis as SortiesKpisData } from "@/lib/metrics";

/** Les montants de la synthèse gardent leurs centimes : c'est un virement,
 *  pas un ordre de grandeur. Les listes, elles, arrondissent. */
function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function SortiesKpis({ kpis, now = new Date() }: { kpis: SortiesKpisData; now?: Date }) {
  const month = MONTHS[now.getMonth()];
  const previousMonth = MONTHS[(now.getMonth() + 11) % 12];
  const delta = kpis.revenueCents - kpis.previousRevenueCents;

  return (
    <section className={styles.sKpis} aria-label={`Synthèse de ${month}`}>
      <p className={styles.sPeriod}>{month}</p>

      <p className={styles.sLead}>
        <span className={styles.sLeadN}>{euros(kpis.revenueCents)}</span>
        {delta !== 0 ? (
          <span className={`${styles.sDelta} ${delta < 0 ? styles.sDeltaDown : ""}`}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {delta > 0 ? <path d="M6 10V2.6" /> : <path d="M6 2v7.4" />}
              {delta > 0 ? <path d="M2.8 5.8 6 2.6l3.2 3.2" /> : <path d="M2.8 6.8 6 10l3.2-3.2" />}
            </svg>
            {euros(Math.abs(delta))} vs {previousMonth}
          </span>
        ) : null}
      </p>
      <p className={styles.sLeadL}>Versés sur votre compte</p>

      <div className={styles.sSub}>
        <span className={styles.sSubIt}>
          <span className={styles.sSubN}>{kpis.photosSoldCount}</span>
          <span className={styles.sSubT}>
            Photo{kpis.photosSoldCount > 1 ? "s" : ""} vendue{kpis.photosSoldCount > 1 ? "s" : ""}
            <small>
              {kpis.photosSoldThisWeek > 0 ? `dont ${kpis.photosSoldThisWeek} cette semaine` : "aucune cette semaine"}
            </small>
          </span>
        </span>

        <span className={styles.sSubIt}>
          <span className={styles.sSubN}>{kpis.sortieCount}</span>
          <span className={styles.sSubT}>
            Sortie{kpis.sortieCount > 1 ? "s" : ""}
            <small>
              {kpis.participantCount > 0
                ? `${kpis.participantCount} participant${kpis.participantCount > 1 ? "s" : ""}`
                : "aucun participant"}
            </small>
          </span>
        </span>
      </div>
    </section>
  );
}
