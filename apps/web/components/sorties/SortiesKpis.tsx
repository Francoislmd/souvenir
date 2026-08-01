import styles from "@/app/(operator)/operator.module.css";
import { formatEuros } from "@/lib/format";
import type { SortiesKpis as SortiesKpisData } from "@/lib/metrics";

function participantLabel(n: number): string {
  return n === 0 ? "Aucun participant" : `${n} participant${n > 1 ? "s" : ""}`;
}

export function SortiesKpis({ kpis }: { kpis: SortiesKpisData }) {
  const revenueDeltaCents = kpis.revenueCents - kpis.previousRevenueCents;
  const revenueUp = revenueDeltaCents > 0;

  return (
    <div className={styles.kpis}>
      <div className={styles.kpi}>
        <div className={styles.k}>Revenus du mois</div>
        <div className={styles.v}>{formatEuros(kpis.revenueCents)}</div>
        <div className={`${styles.d} ${revenueUp ? styles.up : ""}`}>
          {revenueDeltaCents === 0
            ? "Stable vs mois dernier"
            : `${revenueUp ? "+" : "−"} ${formatEuros(Math.abs(revenueDeltaCents))} vs mois dernier`}
        </div>
      </div>

      <div className={styles.kpi}>
        <div className={styles.k}>Sorties du mois</div>
        <div className={styles.v}>{kpis.sortieCount}</div>
        <div className={styles.d}>{participantLabel(kpis.participantCount)}</div>
      </div>

      <div className={styles.kpi}>
        <div className={styles.k}>Photos vendues</div>
        <div className={styles.v}>{kpis.photosSoldCount}</div>
        <div className={`${styles.d} ${kpis.photosSoldThisWeek > 0 ? styles.up : ""}`}>
          {kpis.photosSoldThisWeek > 0 ? `+ ${kpis.photosSoldThisWeek} cette semaine` : "Aucune cette semaine"}
        </div>
      </div>

      <div className={styles.kpi}>
        <div className={styles.k}>Taux d&rsquo;achat</div>
        <div className={styles.v}>{kpis.purchaseRatePercent} %</div>
        <div className={styles.d}>
          {kpis.buyerCount} acheteur{kpis.buyerCount > 1 ? "s" : ""} sur {kpis.participantCount}
        </div>
      </div>
    </div>
  );
}
