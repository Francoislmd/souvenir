import { requireOperatorUser } from "@/lib/current-user";
import { getGmv, getSales, nextPayoutDate } from "@/lib/metrics";
import { formatEuros } from "@/lib/format";
import { AppHeader } from "@/components/operator/AppHeader";
import { CountUp } from "@/components/operator/CountUp";
import styles from "@/app/(operator)/operator.module.css";

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatDayFr(d: Date, now: Date): string {
  const day = 86400000;
  const midnight = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((midnight(d) - midnight(now)) / day);
  if (diff === 0) return "aujourd'hui";
  if (diff === -1) return "hier";
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

export default async function RevenusPage() {
  const dbUser = await requireOperatorUser();
  const now = new Date();
  const [gmv, sales] = await Promise.all([getGmv(dbUser.operatorId), getSales(dbUser.operatorId)]);

  return (
    <>
      <AppHeader title="Revenus" />

      <div className={styles.sWrap}>
        <div className={styles.rvLead}>
          <p className={styles.rvBig}>
            <CountUp value={gmv.operatorCents / 100} decimals={2} suffix=" €" />
          </p>
          <p className={styles.rvSub}>
            Sur votre compte. Vous les recevez <b>{formatDateFr(nextPayoutDate(now))}</b>.
          </p>
        </div>

        <div className={styles.rvRule} />

        <p className={styles.sDay}>Qui a acheté</p>
        <div className={styles.sdClients}>
          {sales.length === 0 ? (
            <p className={styles.sdNote}>Aucun achat pour l&rsquo;instant.</p>
          ) : (
            sales.map((s) => (
              <div key={s.id} className={styles.sdClient}>
                <span className={styles.sdAv}>{s.participantName.slice(0, 2).toUpperCase()}</span>
                <span className={styles.sdClientMain}>
                  <b>{s.participantName}</b>
                  <span>
                    {s.activity} · {formatDayFr(s.paidAt, now)}
                  </span>
                </span>
                <span className={styles.rvAmount}>{formatEuros(s.amountCents)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
