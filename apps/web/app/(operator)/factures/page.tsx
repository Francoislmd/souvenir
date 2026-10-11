import Link from "next/link";
import { requireOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { invoiceIssuer, parisNextMonthStart, unbilledThisMonth } from "@/lib/invoicing";
import { FacturesHeader } from "@/components/factures/FacturesHeader";
import styles from "@/app/(operator)/operator.module.css";

const TZ = "Europe/Paris";

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function monthFr(d: Date): string {
  const s = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: TZ });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function dayFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: TZ }).replace(/^1 /, "1er ");
}

/** « 2026-10-01 » au jour de Paris, pour les champs date. */
function isoDay(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: TZ });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

/**
 * Les factures de commission que Linktrip adresse au pro. Elles partent
 * seules le 1er de chaque mois pour le mois écoulé ; le pro peut aussi en
 * demander une sur des dates de son choix (FacturesHeader). Le PDF est celui
 * de Stripe, qui garde l'original (lib/invoicing.ts).
 */
export default async function FacturesPage() {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const now = new Date();
  const ready = invoiceIssuer() !== null;

  const [invoices, unbilled] = await Promise.all([
    prisma.invoice.findMany({
      where: { operatorId: operator.id, status: "paid" },
      orderBy: [{ periodStart: "desc" }, { issuedAt: "desc" }],
      include: { creditNotes: { orderBy: { createdAt: "asc" } } },
    }),
    unbilledThisMonth(operator.id, now),
  ]);

  const nextRun = parisNextMonthStart(now);
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", timeZone: TZ });

  return (
    <>
      <FacturesHeader
        ready={ready}
        defaultFrom={`${isoDay(now).slice(0, 8)}01`}
        defaultTo={isoDay(now)}
        maxDay={isoDay(now)}
      />

      <div className={styles.sWrap}>
        <div className={styles.rvLead}>
          <p className={styles.rvBig}>{euros(unbilled.cents)}</p>
          <p className={styles.rvSub}>
            {unbilled.count > 0 ? (
              <>
                De commission sur {plural(unbilled.count, "vente", "ventes")} de {monthName}, pas encore facturée.{" "}
                {ready ? (
                  <>
                    La facture arrive le <b>{dayFr(nextRun)}</b>.
                  </>
                ) : null}
              </>
            ) : (
              <>Rien à facturer pour {monthName} à ce jour.</>
            )}
          </p>
        </div>

        {!ready ? (
          <p className={styles.sdNote}>
            La facturation ouvre bientôt. Vos factures de commission apparaîtront ici, une par mois.
          </p>
        ) : !operator.legalAddress?.trim() ? (
          <p className={styles.sdNote}>
            L&rsquo;adresse de votre structure doit figurer sur vos factures. <Link href="/reglages">Ajoutez-la dans Réglages</Link>.
          </p>
        ) : null}

        <div className={styles.rvRule} />

        <p className={styles.sDay}>Vos factures</p>
        <div className={styles.sdClients}>
          {invoices.length === 0 ? (
            <p className={styles.sdNote}>
              Aucune facture pour l&rsquo;instant. Chaque mois où vous vendez, sa facture arrive ici le 1er du mois suivant.
            </p>
          ) : (
            invoices.map((inv) => (
              <div key={inv.id}>
                <a
                  href={`/api/factures/${inv.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.sdClient} ${styles.rvRow}`}
                >
                  <span className={styles.sdAv} aria-hidden="true">
                    {inv.periodStart.toLocaleDateString("fr-FR", { month: "2-digit", timeZone: TZ })}
                  </span>
                  <span className={styles.sdClientMain}>
                    <b>{inv.number ?? "Facture"}</b>
                    <span>
                      {inv.trigger === "manual" ? <em className={styles.rvTag}>À la demande</em> : null}
                      {monthFr(inv.periodStart)} · {plural(inv.lineCount, "vente", "ventes")}
                      {inv.issuedAt ? ` · émise le ${dayFr(inv.issuedAt)}` : ""}
                    </span>
                  </span>
                  <span className={styles.rvAmount}>{euros(inv.amountCents)}</span>
                </a>
                {inv.creditNotes.map((cn) => (
                  <a
                    key={cn.id}
                    href={`/api/factures/avoirs/${cn.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles.sdClient} ${styles.rvRow}`}
                  >
                    <span className={styles.sdAv} aria-hidden="true">AV</span>
                    <span className={styles.sdClientMain}>
                      <b>{cn.number}</b>
                      <span>
                        <em className={styles.rvTag}>Avoir</em>
                        Vente remboursée, sur la facture {inv.number} · le {dayFr(cn.createdAt)}
                      </span>
                    </span>
                    <span className={styles.rvAmount}>−{euros(cn.amountCents)}</span>
                  </a>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
