import { requireOperatorUser } from "@/lib/current-user";
import { getGmv, getSales, nextPayoutDate } from "@/lib/metrics";
import { CountUp } from "@/components/operator/CountUp";
import styles from "@/app/(operator)/operator.module.css";

const AV_VARIANTS = ["", "b", "c"];

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());
}

export default async function RevenusPage() {
  const dbUser = await requireOperatorUser();
  const [gmv, sales] = await Promise.all([getGmv(dbUser.operatorId), getSales(dbUser.operatorId)]);

  return (
    <section className={styles.view}>
      <h1 className={styles.h1}>Revenus</h1>
      <p className={styles.lead}>
        Vous gardez {100 - dbUser.operator.feePercent} % de chaque vente. Virement tous les vendredis.
      </p>

      <div className={styles.balance} style={{ marginTop: 20 }}>
        <div className={styles.k}>Sur votre compte</div>
        <div className={styles.big}>
          <CountUp value={gmv.operatorCents / 100} decimals={2} suffix=" €" />
        </div>
        <div className={styles.nx}>
          Vous les recevez <b>{formatDateFr(nextPayoutDate())}</b>
        </div>
      </div>

      <div className={styles.lbl}>Qui a acheté</div>
      <div className={styles.rows}>
        {sales.length === 0 ? (
          <div className={styles.row} style={{ cursor: "default", color: "var(--ink-4)", fontSize: ".88rem" }}>
            Aucun achat pour l&rsquo;instant.
          </div>
        ) : (
          sales.map((s) => {
            const variant = AV_VARIANTS[s.participantName.length % 3];
            return (
              <div key={s.id} className={styles.row} style={{ cursor: "default" }}>
                <span className={`${styles.av} ${variant ? styles[variant] : ""}`}>{s.participantName.slice(0, 2).toUpperCase()}</span>
                <span className={styles.info}>
                  <span className={styles.ti}>{s.participantName}</span>
                  <span className={styles.sb}>{s.activity}</span>
                </span>
                <span className={styles.amt}>{(s.amountCents / 100).toLocaleString("fr-FR")} €</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
