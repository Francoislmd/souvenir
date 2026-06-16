import { requireAdminUser } from "@/lib/current-user";
import {
  getAttachRate,
  getFunnel,
  getGmv,
  getMedianClaimDelaySec,
  getMedianPurchaseDelaySec,
  getRecentDeliveries,
  type FunnelStep,
} from "@/lib/metrics";
import { formatEuros, formatDuration, maskPhone } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export default async function DashboardPage() {
  const { operator } = await requireAdminUser();

  const [attach, funnel, gmv, claimDelaySec, purchaseDelaySec, recent] = await Promise.all([
    getAttachRate(operator.id),
    getFunnel(operator.id),
    getGmv(operator.id),
    getMedianClaimDelaySec(operator.id),
    getMedianPurchaseDelaySec(operator.id),
    getRecentDeliveries(operator.id),
  ]);

  const attachPercent = Math.round(attach.rate * 100);
  const goalReached = attachPercent >= 20;
  const operatorShare = 100 - operator.feePercent;

  return (
    <main className="flex flex-col gap-6">
      <div>
        <p className="text-sm text-ink-2">Pilote été 2026</p>
        <h1 className="font-display text-2xl font-extrabold text-ink">Bonjour {operator.name} 👋</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Attach rate — l'indicateur go/no-go du pilote */}
        <section className="rounded-card border border-border bg-surface p-5 shadow-card md:col-span-1">
          <p className="text-sm font-medium text-ink-2">Attach rate · achats / ouvertes</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <p className="text-5xl font-semibold tracking-tight text-ink">{attachPercent}%</p>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                goalReached ? "bg-success-tint text-success" : "bg-canvas text-ink-2"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {goalReached ? "objectif 20 % atteint" : "objectif 20 %"}
            </span>
          </div>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-canvas">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, attachPercent)}%` }} />
            <div className="absolute inset-y-[-3px] w-px bg-ink/30" style={{ left: "20%" }} />
          </div>
          <p className="mt-2 text-xs text-ink-2">
            seuil go/no-go à 20 % · {attach.purchases} achat{attach.purchases === 1 ? "" : "s"} / {attach.claims}{" "}
            ouverte{attach.claims === 1 ? "" : "s"}
          </p>
        </section>

        {/* GMV & split */}
        <section className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-4">
          <MetricCard label="GMV" value={formatEuros(gmv.totalCents)} />
          <MetricCard label="Panier moyen" value={formatEuros(gmv.averageCents)} />
          <MetricCard label={`Part ${operator.name} · ${operatorShare}%`} value={formatEuros(gmv.operatorCents)} />
          <MetricCard label={`Part Souvenir · ${operator.feePercent}%`} value={formatEuros(gmv.souvenirCents)} />
        </section>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-card border border-border bg-surface p-5 shadow-card md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Funnel</h2>
            <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-2">
              {funnel[0]?.count ?? 0} livraison{(funnel[0]?.count ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
          <FunnelBars steps={funnel} />
        </section>

        <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Vitesse</h2>
          <div className="rounded-control bg-canvas p-3.5">
            <p className="text-2xl font-semibold text-ink">{claimDelaySec !== null ? formatDuration(claimDelaySec) : "—"}</p>
            <p className="mt-1 text-xs text-ink-2">délai médian upload → ouverture</p>
          </div>
          <div className="rounded-control bg-canvas p-3.5">
            <p className="text-2xl font-semibold text-ink">
              {purchaseDelaySec !== null ? formatDuration(purchaseDelaySec) : "—"}
            </p>
            <p className="mt-1 text-xs text-ink-2">ouverture → achat (médian)</p>
          </div>
        </section>
      </div>

      <section className="rounded-card border border-border bg-surface p-5 shadow-card">
        <h2 className="mb-3 text-base font-semibold text-ink">Livraisons récentes</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-2">Aucune livraison pour l&apos;instant.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-ink-2">
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Client</th>
                  <th className="px-2 py-2">Médias</th>
                  <th className="px-2 py-2">Statut</th>
                  <th className="px-2 py-2 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((delivery) => (
                  <tr key={delivery.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-3 font-mono text-xs font-semibold text-ink">{delivery.code}</td>
                    <td className="px-2 py-3 text-ink-2">
                      {delivery.clientPhone ? maskPhone(delivery.clientPhone) : "—"}
                    </td>
                    <td className="px-2 py-3 text-ink-2">
                      {delivery.mediaCount}
                      {delivery.videoCount > 0 ? ` + ${delivery.videoCount} 🎬` : ""}
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={delivery.status} />
                    </td>
                    <td className="px-2 py-3 text-right font-semibold text-ink">
                      {delivery.amountCents !== null ? formatEuros(delivery.amountCents) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-ink-2">Téléphones masqués · RGPD §11</p>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <p className="text-2xl font-semibold text-ink md:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-ink-2">{label}</p>
    </div>
  );
}

function FunnelBars({ steps }: { steps: FunnelStep[] }) {
  const first = steps[0]?.count ?? 0;
  const max = Math.max(1, ...steps.map((step) => step.count));

  return (
    <div className="flex flex-col gap-3">
      {steps.map((step) => {
        const pct = first > 0 ? Math.round((step.count / first) * 100) : 0;
        return (
          <div key={step.name} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-ink-2">{step.name}</span>
            <div className="h-7 flex-1 overflow-hidden rounded-control bg-canvas">
              <div
                className="flex h-full items-center rounded-control bg-accent pl-3 text-xs font-semibold text-white"
                style={{ width: `${(step.count / max) * 100}%` }}
              >
                {step.count}
              </div>
            </div>
            <span className="w-12 shrink-0 text-right text-sm font-semibold text-ink">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}
