import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOperatorUser } from "@/lib/current-user";
import { getSaleDetail } from "@/lib/sale-detail";
import { formatHourFr, formatSortieTitle, formatWhenFr } from "@/lib/format";
import { CGV_DATE_LABEL, formatSiret } from "@/lib/seller-format";
import { AppHeader } from "@/components/operator/AppHeader";
import styles from "@/app/(operator)/operator.module.css";

export const dynamic = "force-dynamic";

const TZ = "Europe/Paris";

/** « 32,00 € » : sur un détail de compte, les centimes comptent. */
function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function dayFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n > 1 ? many : one}`;
}

function contentLabel(isPack: boolean, items: number, videos: number): string {
  if (isPack) return "Tout le lot, y compris ce qui sera ajouté ensuite";
  const photos = items - videos;
  return [photos > 0 ? plural(photos, "photo", "photos") : null, videos > 0 ? plural(videos, "vidéo", "vidéos") : null]
    .filter(Boolean)
    .join(" et ");
}

const STATUS: Record<string, string> = {
  succeeded: "Payé",
  refunded: "Remboursé",
  disputed: "Contesté",
  failed: "Échoué",
  pending: "En attente",
};

export default async function SaleDetailPage({ params }: { params: { orderId: string } }) {
  const dbUser = await requireOperatorUser();
  const sale = await getSaleDetail(dbUser.operatorId, params.orderId);
  if (!sale) notFound();

  const percent = sale.amountCents > 0 ? Math.round((sale.feeCents / sale.amountCents) * 100) : 0;
  const settled = sale.status === "succeeded" && sale.refundedCents === 0 && !sale.disputeStatus;
  const netCents = sale.stripe ? sale.amountCents - sale.feeCents - sale.stripe.feeCents - sale.refundedCents : null;
  const { seller } = sale;

  return (
    <>
      <AppHeader title={sale.client.name} backHref="/revenus" backLabel="Revenus" />

      <div className={styles.sWrap}>
        <div className={styles.rvLead}>
          <p className={styles.rvBig}>{euros(sale.amountCents)}</p>
          <p className={styles.rvSub}>
            {STATUS[sale.status] ?? sale.status} le <b>{dayFr(sale.paidAt)}</b> à {formatHourFr(sale.paidAt)}. Commande {sale.ref}.
          </p>
        </div>

        <div className={styles.rvRule} />

        <p className={styles.sDay}>Le compte</p>
        <dl className={styles.rvLines}>
          <div>
            <dt>Payé par le client</dt>
            <dd>{euros(sale.amountCents)}</dd>
          </div>
          <div>
            <dt>Commission Linktrip ({percent} %)</dt>
            <dd>−{euros(sale.feeCents)}</dd>
          </div>
          <div>
            <dt>Frais Stripe</dt>
            <dd>{sale.stripe ? `−${euros(sale.stripe.feeCents)}` : <span className={styles.rvMuted}>indisponibles</span>}</dd>
          </div>
          {sale.refundedCents > 0 ? (
            <div>
              <dt>Remboursé au client{sale.refundedAt ? ` le ${dayFr(sale.refundedAt)}` : ""}</dt>
              <dd>−{euros(sale.refundedCents)}</dd>
            </div>
          ) : null}
          <div className={styles.rvTotal}>
            <dt>Pour vous</dt>
            <dd>{netCents !== null ? euros(netCents) : euros(sale.amountCents - sale.feeCents - sale.refundedCents)}</dd>
          </div>
        </dl>
        <p className={styles.sdNote}>
          {netCents === null
            ? "Avant frais Stripe : Stripe ne les a pas communiqués pour ce paiement."
            : !settled
              ? "Montant indicatif : un remboursement ou une contestation peut modifier les frais retenus par Stripe."
              : sale.stripe?.availableOn
                ? `Disponible sur votre solde Stripe le ${dayFr(sale.stripe.availableOn)}.`
                : null}
          {sale.disputeStatus ? " Ce paiement fait l’objet d’une contestation : la galerie du client est verrouillée." : null}
        </p>

        <div className={styles.rvRule} />

        <p className={styles.sDay}>L&rsquo;achat</p>
        <dl className={styles.rvLines}>
          <div>
            <dt>Sortie</dt>
            <dd>
              <Link href={`/sorties/${sale.sortie.id}`} className={styles.rvLink}>
                {formatSortieTitle(sale.sortie.activity, sale.sortie.place)}
              </Link>
              <span className={styles.rvMuted}>{formatWhenFr(sale.sortie.startsAt)}</span>
            </dd>
          </div>
          {sale.slotLabel ? (
            <div>
              <dt>Départ</dt>
              <dd>{sale.slotLabel}</dd>
            </div>
          ) : null}
          <div>
            <dt>Contenu</dt>
            <dd>{contentLabel(sale.isPack, sale.itemCount, sale.videoCount) || "—"}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>
              {sale.client.name}
              <span className={styles.rvMuted}>{sale.client.contact}</span>
            </dd>
          </div>
          {sale.stripe?.method ? (
            <div>
              <dt>Moyen de paiement</dt>
              <dd>{sale.stripe.method}</dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.rvRule} />

        <p className={styles.sDay}>Mentions du reçu</p>
        <dl className={styles.rvLines}>
          <div>
            <dt>Vendeur</dt>
            <dd>
              {seller.name}
              {seller.address ? <span className={styles.rvMuted}>{seller.address}</span> : null}
            </dd>
          </div>
          <div>
            <dt>SIRET</dt>
            <dd>
              {seller.siret ? (
                formatSiret(seller.siret)
              ) : (
                <Link href="/reglages" className={styles.rvLink}>
                  À compléter dans Réglages
                </Link>
              )}
            </dd>
          </div>
          <div>
            <dt>TVA</dt>
            <dd>{seller.vatExempt ? "Non applicable, art. 293 B du CGI" : "Prix TTC, TVA due par le vendeur"}</dd>
          </div>
          <div>
            <dt>Livraison</dt>
            <dd>Immédiate, à la demande du client. Pas de droit de rétractation (art. L221-28 du Code de la consommation).</dd>
          </div>
          <div>
            <dt>Conditions</dt>
            <dd>CGV du {CGV_DATE_LABEL}</dd>
          </div>
          <div>
            <dt>Commande</dt>
            <dd>{sale.ref}</dd>
          </div>
          {sale.stripePi ? (
            <div>
              <dt>Référence Stripe</dt>
              <dd className={styles.rvMono}>{sale.stripePi}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </>
  );
}
