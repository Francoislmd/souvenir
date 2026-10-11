"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "@/app/(operator)/operator.module.css";
import { Spinner } from "@/components/ui/Spinner";
import { formatHourFr, formatSortieTitle, formatWhenFr } from "@/lib/format";
import { CGV_DATE_LABEL, formatSiret } from "@/lib/seller-format";
import type { SaleDetail } from "@/lib/sale-detail";

/** SaleDetail tel qu'il arrive en JSON : les dates sont des chaînes. */
type Json<T> = { [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K] extends object | null ? Json<T[K]> : T[K] };
type Sale = Json<SaleDetail>;

const TZ = "Europe/Paris";

/** « 32,00 € » : sur un détail de compte, les centimes comptent. */
function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

function dayFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
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

/**
 * Le détail d'un achat, en fenêtre par-dessus la liste des revenus : le
 * compte (commission, frais Stripe, ce qui revient au pro), l'achat, et les
 * mentions qui figurent sur le reçu du client.
 */
export function SaleSheet({ orderId, title, onClose }: { orderId: string; title: string; onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [sale, setSale] = useState<Sale | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setSale(null);
    setFailed(false);
    fetch(`/api/revenus/${encodeURIComponent(orderId)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        return ((await res.json()) as { sale: Sale }).sale;
      })
      .then((s) => {
        if (!cancelled) setSale(s);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className={styles.shOverlay} onClick={onClose} role="presentation">
      <div
        ref={panelRef}
        className={`${styles.shPanel} ${styles.nsPanel} ${styles.rvPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rvTitle"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <span className={styles.shGrip} aria-hidden="true" />
        <header className={styles.nsHead}>
          <h2 id="rvTitle" className={styles.nsTitle}>
            {title}
          </h2>
          <button type="button" className={styles.nsClose} onClick={onClose} aria-label="Fermer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div className={styles.rvSheetBody}>
          {failed ? (
            <p className={styles.sdNote}>Le détail ne se charge pas. Réessayez dans un instant.</p>
          ) : !sale ? (
            <div className={styles.rvSheetWait}>
              <Spinner size={20} label="Chargement du détail" />
            </div>
          ) : (
            <SaleBody sale={sale} />
          )}
        </div>
      </div>
    </div>
  );
}

function SaleBody({ sale }: { sale: Sale }) {
  const percent = sale.amountCents > 0 ? Math.round((sale.feeCents / sale.amountCents) * 100) : 0;
  const settled = sale.status === "succeeded" && sale.refundedCents === 0 && !sale.disputeStatus;
  const netCents = sale.stripe ? sale.amountCents - sale.feeCents - sale.stripe.feeCents - sale.refundedCents : null;
  const { seller } = sale;
  const paidAt = new Date(sale.paidAt);

  const note =
    netCents === null
      ? "Avant frais Stripe : Stripe ne les a pas communiqués pour ce paiement."
      : !settled
        ? "Montant indicatif : un remboursement ou une contestation peut modifier les frais retenus par Stripe."
        : sale.stripe?.availableOn
          ? `Disponible sur votre solde Stripe le ${dayFr(sale.stripe.availableOn)}.`
          : null;

  return (
    <>
      <div className={styles.rvSheetLead}>
        <p className={styles.rvSheetBig}>{euros(sale.amountCents)}</p>
        <p className={styles.rvSub}>
          {STATUS[sale.status] ?? sale.status} le {dayFr(sale.paidAt)} à {formatHourFr(paidAt)}. Commande {sale.ref}.
        </p>
      </div>

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
          <dd>{euros(netCents ?? sale.amountCents - sale.feeCents - sale.refundedCents)}</dd>
        </div>
      </dl>
      {note || sale.disputeStatus ? (
        <p className={styles.rvSheetNote}>
          {note}
          {sale.disputeStatus ? " Ce paiement est contesté : la galerie du client est verrouillée." : null}
        </p>
      ) : null}

      <p className={styles.sDay}>L&rsquo;achat</p>
      <dl className={styles.rvLines}>
        <div>
          <dt>Sortie</dt>
          <dd>
            <Link href={`/sorties/${sale.sortie.id}`} className={styles.rvLink}>
              {formatSortieTitle(sale.sortie.activity, sale.sortie.place)}
            </Link>
            <span className={styles.rvMuted}>{formatWhenFr(new Date(sale.sortie.startsAt))}</span>
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
            <dt>Paiement</dt>
            <dd>{sale.stripe.method}</dd>
          </div>
        ) : null}
      </dl>

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
        {sale.stripePi ? (
          <div>
            <dt>Référence Stripe</dt>
            <dd className={styles.rvMono}>{sale.stripePi}</dd>
          </div>
        ) : null}
      </dl>
    </>
  );
}
