import type Stripe from "stripe";
import { prisma } from "./prisma";
import { stripe } from "./stripe";
import { env } from "./env";
import { feeRefundedCents as proratedFeeRefund } from "./fees";
import { formatSiret } from "./seller-format";
import { parisWallClockToInstant } from "./wall-clock";

/**
 * Les factures de commission Linktrip → opérateur.
 *
 * La commission est prélevée par Stripe au moment de chaque vente
 * (`application_fee_amount`, charge directe) : il n'y a rien à encaisser, mais
 * une prestation entre professionnels doit être facturée (art. 289 CGI). Les
 * factures sont émises par **Stripe Invoicing**, sur le compte plateforme,
 * puis marquées **payées hors Stripe** : Stripe ne prélève rien sur une
 * facture réglée en dehors de lui, et il tient le numéro, le PDF et
 * l'archive.
 *
 * Règles qui en découlent :
 * - **Une facture = un mois civil au plus.** La facture récapitulative ne
 *   peut regrouper que des opérations du même mois civil (art. 289 I-3 CGI) :
 *   une période à cheval sur deux mois donne deux factures.
 * - **Une ligne par vente**, avec sa date, même quand les ventes se
 *   ressemblent (BOI-TVA-DECLA-30-20-10).
 * - **Chaque vente sur une seule facture** : la commande est réservée
 *   (`Order.invoiceId`) avant tout appel à Stripe, dans la même transaction
 *   que la création de la facture. Le cron du mois et une génération manuelle
 *   simultanée ne peuvent donc pas facturer deux fois la même vente.
 * - **Une facture émise ne se modifie pas** : un remboursement après coup
 *   donne un avoir (`creditOrderFee`), jamais une facture corrigée.
 * - Tout est **rejouable** : chaque étape relit l'état de Stripe avant
 *   d'agir (`completeInvoice`), le cron reprend ce qu'une coupure a laissé.
 */

const TZ = "Europe/Paris";
/** Stripe refuse plus de 250 lignes par facture. */
const MAX_LINES = 250;
/** Statuts de commande dont la commission est due (un litige ne rend pas la commission). */
const BILLABLE_STATUSES = ["succeeded", "refunded", "disputed"];

export class InvoicingNotReadyError extends Error {
  constructor() {
    super("L'émetteur des factures n'est pas configuré (INVOICE_ISSUER_*).");
  }
}

export interface InvoiceIssuer {
  tradeName: string;
  name: string;
  address: string;
  siren: string;
  vatMention: string;
}

/** L'émetteur, ou null tant que Linktrip n'a pas de SIREN : aucune facture ne part sans. */
export function invoiceIssuer(): InvoiceIssuer | null {
  if (!env.INVOICE_ISSUER_NAME || !env.INVOICE_ISSUER_ADDRESS || !env.INVOICE_ISSUER_SIREN) return null;
  return {
    tradeName: env.INVOICE_ISSUER_TRADE_NAME,
    name: env.INVOICE_ISSUER_NAME,
    address: env.INVOICE_ISSUER_ADDRESS,
    siren: env.INVOICE_ISSUER_SIREN,
    vatMention: env.INVOICE_VAT_MENTION,
  };
}

// ---------------------------------------------------------------------------
// Dates : tout se découpe en mois civils de Paris.
// ---------------------------------------------------------------------------

const ymdParts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });

function parisYmd(instant: Date): { y: number; m: number; d: number } {
  const parts = ymdParts.formatToParts(instant);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** Minuit à Paris, le 1er du mois de cet instant. */
export function parisMonthStart(instant: Date): Date {
  const { y, m } = parisYmd(instant);
  return parisWallClockToInstant(y, m, 1, 0, 0, 0);
}

/** Minuit à Paris, le 1er du mois suivant. */
export function parisNextMonthStart(instant: Date): Date {
  const { y, m } = parisYmd(instant);
  return m === 12 ? parisWallClockToInstant(y + 1, 1, 1, 0, 0, 0) : parisWallClockToInstant(y, m + 1, 1, 0, 0, 0);
}

/** « 2026-10-12 » (jour de Paris) → minuit à Paris ce jour-là. */
export function parisDayStart(isoDay: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDay);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) return null;
  return parisWallClockToInstant(y, mo, d, 0, 0, 0);
}

/** [from, to) découpé aux frontières des mois civils de Paris. */
export function splitByParisMonth(from: Date, to: Date): Array<{ start: Date; end: Date }> {
  const out: Array<{ start: Date; end: Date }> = [];
  let cursor = from;
  while (cursor < to) {
    const next = parisNextMonthStart(cursor);
    const end = next < to ? next : to;
    out.push({ start: cursor, end });
    cursor = end;
  }
  return out;
}

function dayFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TZ });
}

function longDayFr(d: Date): string {
  const s = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
  return s.replace(/^1 /, "1er ");
}

/** « du 1er au 31 octobre 2026 » — la fin est exclusive, on affiche la veille. */
export function periodLabel(start: Date, endExclusive: Date): string {
  const last = new Date(endExclusive.getTime() - 1);
  const a = parisYmd(start);
  const b = parisYmd(last);
  const startTxt = longDayFr(start);
  const endTxt = longDayFr(last);
  if (a.y === b.y && a.m === b.m) {
    if (a.d === b.d) return `le ${endTxt}`;
    return `du ${startTxt.split(" ")[0]} au ${endTxt}`;
  }
  return `du ${startTxt} au ${endTxt}`;
}

function euros(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

// ---------------------------------------------------------------------------
// Commission due sur une commande.
// ---------------------------------------------------------------------------

type FeeFields = { amountCents: number; feeCents: number; refundedAmountCents: number; feeRefundedCents: number };

/**
 * Ce que Linktrip garde de sa commission sur cette vente. `feeRefundedCents`
 * est relu chez Stripe à chaque remboursement ; pour les remboursements faits
 * avant qu'il existe, on retient le prorata si c'est plus favorable au pro :
 * une facture ne doit jamais dépasser ce qui a été réellement prélevé.
 */
export function feeDueCents(o: FeeFields): number {
  const refunded = Math.max(o.feeRefundedCents, proratedFeeRefund(o.feeCents, o.amountCents, o.refundedAmountCents));
  return Math.max(0, o.feeCents - refunded);
}

// ---------------------------------------------------------------------------
// Client Stripe de l'opérateur (sur le compte plateforme).
// ---------------------------------------------------------------------------

async function ensureCustomer(operatorId: string): Promise<string> {
  const op = await prisma.operator.findUniqueOrThrow({
    where: { id: operatorId },
    select: { id: true, name: true, legalName: true, legalAddress: true, stripeCustomerId: true },
  });
  // Pas d'e-mail sur le client : Stripe n'envoie ainsi jamais rien de lui-même
  // (factures, reçus, avoirs). Les factures se consultent dans l'onglet Factures.
  const fields: Stripe.CustomerCreateParams = {
    name: op.legalName?.trim() || op.name,
    address: op.legalAddress?.trim() ? { line1: op.legalAddress.trim(), country: "FR" } : undefined,
    preferred_locales: ["fr-FR"],
    metadata: { operatorId: op.id },
  };
  if (op.stripeCustomerId) {
    // L'identité a pu changer dans Réglages : la facture doit porter la bonne.
    await stripe.customers.update(op.stripeCustomerId, { name: fields.name, address: fields.address ?? "", preferred_locales: ["fr-FR"] });
    return op.stripeCustomerId;
  }
  const customer = await stripe.customers.create(fields, { idempotencyKey: `customer-${op.id}` });
  await prisma.operator.update({ where: { id: op.id }, data: { stripeCustomerId: customer.id } });
  return customer.id;
}

// ---------------------------------------------------------------------------
// Émission.
// ---------------------------------------------------------------------------

function invoiceFooter(issuer: InvoiceIssuer): string {
  return [
    `${issuer.tradeName} · ${issuer.name} EI · ${issuer.address} · SIREN ${issuer.siren.replace(/^(\d{3})(\d{3})(\d{3})$/, "$1 $2 $3")}`,
    `${issuer.vatMention}.`,
    "Facture acquittée : la commission a été prélevée par Stripe au moment de chaque vente, sur le paiement du client.",
    "Escompte pour paiement anticipé : néant. En cas de retard de paiement : pénalités au taux de trois fois le taux d'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L. 441-10 du Code de commerce).",
  ].join("\n");
}

type ClaimedOrder = FeeFields & { id: string; paidAt: Date | null; activity: string; feeInvoicedCents: number | null };

async function loadClaimed(invoiceId: string): Promise<ClaimedOrder[]> {
  const rows = await prisma.order.findMany({
    where: { invoiceId },
    orderBy: { paidAt: "asc" },
    select: {
      id: true,
      paidAt: true,
      amountCents: true,
      feeCents: true,
      refundedAmountCents: true,
      feeRefundedCents: true,
      feeInvoicedCents: true,
      participant: { select: { sortie: { select: { activity: true } } } },
    },
  });
  return rows.map(({ participant, ...r }) => ({ ...r, activity: participant.sortie.activity }));
}

function lineDescription(o: ClaimedOrder): string {
  const pct = o.amountCents > 0 ? Math.round((o.feeCents * 100) / o.amountCents) : 0;
  const parts = [
    o.paidAt ? dayFr(o.paidAt) : null,
    `Commission ${pct} % sur une vente de ${euros(o.amountCents)}`,
    o.activity,
    `réf. ${o.id.slice(-8).toUpperCase()}`,
  ];
  if (o.refundedAmountCents > 0) parts.push("après remboursement");
  return parts.filter(Boolean).join(" · ");
}

/**
 * Mène une facture réservée jusqu'à « payée » chez Stripe. Chaque étape relit
 * l'état réel (brouillon, lignes déjà posées, finalisée, payée) : appelée deux
 * fois, ou après une coupure, elle reprend où elle s'était arrêtée.
 */
export async function completeInvoice(invoiceId: string): Promise<void> {
  const issuer = invoiceIssuer();
  if (!issuer) throw new InvoicingNotReadyError();

  const inv = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { operator: { select: { siret: true } } },
  });
  if (inv.status === "paid") return;

  let orders = await loadClaimed(inv.id);
  // Montant figé à la réservation (feeInvoicedCents), sinon calculé maintenant.
  const amountOf = (o: ClaimedOrder) => o.feeInvoicedCents ?? feeDueCents(o);

  let stripeId = inv.stripeInvoiceId;
  if (!stripeId) {
    if (orders.length === 0) {
      await prisma.invoice.delete({ where: { id: inv.id } });
      return;
    }
    const customer = await ensureCustomer(inv.operatorId);
    const siret = inv.operator.siret?.trim();
    const created = await stripe.invoices.create(
      {
        customer,
        currency: "eur",
        collection_method: "send_invoice",
        days_until_due: 0,
        auto_advance: false,
        pending_invoice_items_behavior: "exclude",
        description: "Commission Linktrip sur les ventes de photos réalisées sur la plateforme, une ligne par vente.",
        footer: invoiceFooter(issuer),
        custom_fields: [
          { name: "Période", value: periodLabel(inv.periodStart, inv.periodEnd) },
          { name: "Nature", value: "Prestation de services" },
          ...(siret ? [{ name: "SIRET du client", value: formatSiret(siret) }] : []),
          { name: "Règlement", value: "Prélevé sur chaque vente (Stripe)" },
        ],
        metadata: { linktripInvoiceId: inv.id, operatorId: inv.operatorId },
      },
      { idempotencyKey: `invoice-${inv.id}` },
    );
    stripeId = created.id;
    await prisma.invoice.update({ where: { id: inv.id }, data: { stripeInvoiceId: stripeId } });
  }

  let current = await stripe.invoices.retrieve(stripeId);

  if (current.status === "draft") {
    // Les lignes déjà posées (coupure au milieu de la boucle) ne sont pas refaites.
    const present = new Set<string>();
    for await (const line of stripe.invoices.listLineItems(stripeId, { limit: 100 })) {
      if (line.metadata?.orderId) present.add(line.metadata.orderId);
    }
    // Une commande dont la commission est retombée à zéro entre-temps
    // (remboursée avant l'émission) sort de la facture.
    const zero = orders.filter((o) => !present.has(o.id) && amountOf(o) <= 0).map((o) => o.id);
    if (zero.length > 0) {
      await prisma.order.updateMany({ where: { id: { in: zero }, invoiceId: inv.id }, data: { invoiceId: null, feeInvoicedCents: null } });
      orders = orders.filter((o) => !zero.includes(o.id));
    }
    for (const o of orders) {
      if (present.has(o.id)) continue;
      await stripe.invoiceItems.create(
        {
          customer: current.customer as string,
          invoice: stripeId,
          currency: "eur",
          amount: amountOf(o),
          description: lineDescription(o),
          ...(o.paidAt ? { period: { start: Math.floor(o.paidAt.getTime() / 1000), end: Math.floor(o.paidAt.getTime() / 1000) } } : {}),
          metadata: { orderId: o.id },
        },
        { idempotencyKey: `invoice-${inv.id}-line-${o.id}` },
      );
    }
    if (orders.length === 0 && present.size === 0) {
      // Plus rien à facturer : le brouillon n'a jamais eu de numéro, on le supprime.
      await stripe.invoices.del(stripeId);
      await prisma.invoice.delete({ where: { id: inv.id } });
      return;
    }
    current = await stripe.invoices.finalizeInvoice(stripeId, { auto_advance: false });
  }

  if (current.status === "open") {
    await prisma.invoice.update({ where: { id: inv.id }, data: { status: "open", number: current.number } });
    current = await stripe.invoices.pay(stripeId, { paid_out_of_band: true });
  }

  if (current.status === "paid") {
    const finalizedAt = current.status_transitions?.finalized_at;
    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        status: "paid",
        number: current.number,
        amountCents: current.total,
        lineCount: orders.length,
        issuedAt: finalizedAt ? new Date(finalizedAt * 1000) : new Date(),
      },
    });
  }
}

/**
 * Réserve les ventes non facturées de [start, end) — un seul mois civil —
 * pour un opérateur, et les facture. Renvoie les identifiants des factures
 * émises (plusieurs au-delà de 250 ventes).
 */
async function invoiceRange(operatorId: string, start: Date, end: Date, trigger: "monthly" | "manual"): Promise<string[]> {
  const candidates = await prisma.order.findMany({
    where: {
      invoiceId: null,
      status: { in: BILLABLE_STATUSES },
      paidAt: { gte: start, lt: end },
      participant: { sortie: { operatorId } },
    },
    orderBy: { paidAt: "asc" },
    select: { id: true, amountCents: true, feeCents: true, refundedAmountCents: true, feeRefundedCents: true },
  });
  const billable = candidates.filter((o) => feeDueCents(o) > 0);
  const ids: string[] = [];

  for (let i = 0; i < billable.length; i += MAX_LINES) {
    const chunk = billable.slice(i, i + MAX_LINES);
    // Réservation : seules les commandes encore libres passent à cette
    // facture. Un concurrent qui en a pris une la garde.
    const invoiceId = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({ data: { operatorId, trigger, periodStart: start, periodEnd: end } });
      for (const o of chunk) {
        await tx.order.updateMany({
          where: { id: o.id, invoiceId: null },
          data: { invoiceId: inv.id, feeInvoicedCents: feeDueCents(o) },
        });
      }
      const claimed = await tx.order.count({ where: { invoiceId: inv.id } });
      if (claimed === 0) {
        await tx.invoice.delete({ where: { id: inv.id } });
        return null;
      }
      return inv.id;
    });
    if (!invoiceId) continue;

    try {
      await completeInvoice(invoiceId);
    } catch (error) {
      // Rien n'a été finalisé : on rend les ventes, la prochaine tentative les reprendra.
      const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (inv && inv.status === "pending") {
        const draft = inv.stripeInvoiceId ? await stripe.invoices.retrieve(inv.stripeInvoiceId).catch(() => null) : null;
        if (!draft || draft.status === "draft") {
          if (draft) await stripe.invoices.del(draft.id).catch(() => undefined);
          await prisma.order.updateMany({ where: { invoiceId }, data: { invoiceId: null, feeInvoicedCents: null } });
          await prisma.invoice.delete({ where: { id: invoiceId } });
        }
      }
      throw error;
    }
    const done = await prisma.invoice.findUnique({ where: { id: invoiceId }, select: { id: true } });
    if (done) ids.push(done.id);
  }
  return ids;
}

/**
 * La génération demandée par le pro : du jour `fromDay` au jour `toDay`
 * inclus (heure de Paris), une facture par mois civil, sur les seules ventes
 * pas encore facturées. Le futur est écarté.
 */
export async function generateInvoices(operatorId: string, fromDay: string, toDay: string, now = new Date()): Promise<string[]> {
  if (!invoiceIssuer()) throw new InvoicingNotReadyError();
  const from = parisDayStart(fromDay);
  const toStart = parisDayStart(toDay);
  if (!from || !toStart || toStart < from) throw new RangeError("Période invalide.");
  const { y, m, d } = parisYmd(toStart);
  const toEnd = parisWallClockToInstant(y, m, d + 1, 0, 0, 0);
  const end = toEnd < now ? toEnd : now;
  if (end <= from) return [];

  const ids: string[] = [];
  for (const month of splitByParisMonth(from, end)) {
    ids.push(...(await invoiceRange(operatorId, month.start, month.end, "manual")));
  }
  return ids;
}

/**
 * Le cron du 1er du mois : toutes les ventes payées avant le mois en cours et
 * pas encore facturées (le mois écoulé, et les retardataires d'avant), par
 * opérateur et par mois. Puis il reprend ce qu'une coupure a laissé en route :
 * factures non terminées, avoirs non émis.
 */
export async function runMonthlyInvoicing(now = new Date()): Promise<{ issued: number; resumed: number; credited: number; failed: number }> {
  const result = { issued: 0, resumed: 0, credited: 0, failed: 0 };
  if (!invoiceIssuer()) return result;

  // 1. Reprises : une facture réservée depuis plus de 10 minutes est orpheline.
  const stale = await prisma.invoice.findMany({
    where: { status: { in: ["pending", "open"] }, createdAt: { lt: new Date(now.getTime() - 10 * 60_000) } },
    select: { id: true },
  });
  for (const inv of stale) {
    try {
      await completeInvoice(inv.id);
      result.resumed++;
    } catch (error) {
      console.error("[invoicing] reprise impossible", inv.id, error);
      result.failed++;
    }
  }

  // 2. Le mois écoulé, et tout ce qui traîne avant.
  const monthStart = parisMonthStart(now);
  const pending = await prisma.order.findMany({
    where: { invoiceId: null, status: { in: BILLABLE_STATUSES }, paidAt: { lt: monthStart } },
    select: { paidAt: true, participant: { select: { sortie: { select: { operatorId: true } } } } },
  });
  const groups = new Map<string, { operatorId: string; start: Date }>();
  for (const o of pending) {
    if (!o.paidAt) continue;
    const start = parisMonthStart(o.paidAt);
    const operatorId = o.participant.sortie.operatorId;
    groups.set(`${operatorId}|${start.toISOString()}`, { operatorId, start });
  }
  for (const g of Array.from(groups.values())) {
    try {
      const ids = await invoiceRange(g.operatorId, g.start, parisNextMonthStart(g.start), "monthly");
      result.issued += ids.length;
    } catch (error) {
      console.error("[invoicing] facture mensuelle impossible", g.operatorId, g.start.toISOString(), error);
      result.failed++;
    }
  }

  // 3. Avoirs restés en attente (remboursement survenu pendant une panne Stripe).
  const toCredit = await prisma.order.findMany({
    where: { invoice: { status: "paid" }, feeRefundedCents: { gt: 0 } },
    select: { id: true, feeRefundedCents: true, feeCreditedCents: true, feeInvoicedCents: true },
  });
  for (const o of toCredit) {
    if (creditableCents(o) <= 0) continue;
    try {
      if (await creditOrderFee(o.id)) result.credited++;
    } catch (error) {
      console.error("[invoicing] avoir impossible", o.id, error);
      result.failed++;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Avoirs.
// ---------------------------------------------------------------------------

function creditableCents(o: { feeRefundedCents: number; feeCreditedCents: number; feeInvoicedCents: number | null }): number {
  if (o.feeInvoicedCents == null) return 0;
  return Math.min(o.feeRefundedCents, o.feeInvoicedCents) - o.feeCreditedCents;
}

/**
 * Une vente déjà facturée est remboursée : Stripe a rendu une part de la
 * commission au pro, la facture émise ne bouge pas, un avoir la corrige.
 * Sans effet si la vente n'est pas facturée (la facture à venir portera
 * directement le bon montant) ou si l'avoir a déjà été émis.
 */
export async function creditOrderFee(orderId: string): Promise<boolean> {
  if (!invoiceIssuer()) return false;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      paidAt: true,
      feeRefundedCents: true,
      feeCreditedCents: true,
      feeInvoicedCents: true,
      invoice: { select: { id: true, status: true, stripeInvoiceId: true, number: true } },
    },
  });
  if (!order?.invoice || order.invoice.status !== "paid" || !order.invoice.stripeInvoiceId) return false;
  const delta = creditableCents(order);
  if (delta <= 0) return false;

  // Réservation du montant avant l'appel : deux webhooks simultanés n'émettent pas deux avoirs.
  const before = order.feeCreditedCents;
  const claimed = await prisma.order.updateMany({
    where: { id: order.id, feeCreditedCents: before },
    data: { feeCreditedCents: before + delta },
  });
  if (claimed.count === 0) return false;

  try {
    const note = await stripe.creditNotes.create(
      {
        invoice: order.invoice.stripeInvoiceId,
        lines: [
          {
            type: "custom_line_item",
            description: `Commission rendue sur la vente du ${order.paidAt ? dayFr(order.paidAt) : "—"} (réf. ${order.id.slice(-8).toUpperCase()}), remboursée au client`,
            quantity: 1,
            unit_amount: delta,
          },
        ],
        out_of_band_amount: delta,
        memo: `Avoir sur la facture ${order.invoice.number ?? ""}`.trim(),
        metadata: { orderId: order.id },
      },
      { idempotencyKey: `credit-${order.id}-${before}-${delta}` },
    );
    await prisma.invoiceCreditNote.create({
      data: { invoiceId: order.invoice.id, orderId: order.id, stripeCreditNoteId: note.id, number: note.number, amountCents: note.total },
    });
    return true;
  } catch (error) {
    await prisma.order.updateMany({ where: { id: order.id, feeCreditedCents: before + delta }, data: { feeCreditedCents: before } });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Commission rendue, relue chez Stripe.
// ---------------------------------------------------------------------------

/**
 * La part de commission que Stripe a rendue sur ce paiement
 * (`ApplicationFee.amount_refunded`, compte plateforme). C'est la seule
 * source juste : un remboursement fait depuis le tableau de bord Stripe du pro
 * peut ne rien rendre, un remboursement depuis Linktrip rend au prorata.
 */
export async function applicationFeeRefundedCents(charge: Pick<Stripe.Charge, "application_fee">): Promise<number | null> {
  const fee = charge.application_fee;
  if (!fee) return null;
  if (typeof fee !== "string") return fee.amount_refunded;
  const loaded = await stripe.applicationFees.retrieve(fee);
  return loaded.amount_refunded;
}

/** Ce qui reste à facturer pour un opérateur, du 1er du mois à maintenant. */
export async function unbilledThisMonth(operatorId: string, now = new Date()): Promise<{ cents: number; count: number }> {
  const rows = await prisma.order.findMany({
    where: { invoiceId: null, status: { in: BILLABLE_STATUSES }, paidAt: { gte: parisMonthStart(now), lt: now }, participant: { sortie: { operatorId } } },
    select: { amountCents: true, feeCents: true, refundedAmountCents: true, feeRefundedCents: true },
  });
  const due = rows.map(feeDueCents).filter((c) => c > 0);
  return { cents: due.reduce((a, b) => a + b, 0), count: due.length };
}
