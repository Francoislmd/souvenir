import Link from "next/link";
import { requireAdminUser } from "@/lib/current-user";
import { getAttachRate, getGmv, getRevenueByDay, getPurchases, type DayRevenue } from "@/lib/metrics";
import { formatEuros } from "@/lib/format";
import { PurchaseTable } from "@/components/dashboard/PurchaseTable";

const PERIOD_OPTIONS = [
  { label: "7 jours", value: 7 },
  { label: "30 jours", value: 30 },
  { label: "90 jours", value: 90 },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: string };
}) {
  const { operator } = await requireAdminUser();

  const period = Math.max(7, Math.min(90, Number(searchParams.period ?? 30) || 30));
  const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

  const [attach, gmv, revenueByDay, purchases] = await Promise.all([
    getAttachRate(operator.id, since),
    getGmv(operator.id, since),
    getRevenueByDay(operator.id, period),
    getPurchases(operator.id, since),
  ]);

  const attachPercent = Math.round(attach.rate * 100);

  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      {/* En-tête + filtre de période */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-extrabold text-ink">Dashboard</h1>

        <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1 shadow-card">
          {PERIOD_OPTIONS.map(({ label, value }) => (
            <Link
              key={value}
              href={`?period=${value}`}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                period === value
                  ? "bg-accent text-white"
                  : "text-ink-2 hover:text-ink"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid gap-4 md:grid-cols-3">

        {/* CA + courbe — 2 colonnes */}
        <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card md:col-span-2">
          <div className="px-5 pt-5 pb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Chiffre d&apos;affaires</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">
              {formatEuros(gmv.totalCents)}
            </p>
            <p className="mt-0.5 text-xs text-ink-2">
              {gmv.orderCount} achat{gmv.orderCount !== 1 ? "s" : ""} · {period} derniers jours
            </p>
          </div>
          <div className="px-4 pb-4 pt-1">
            <RevenueLineChart data={revenueByDay} days={period} />
          </div>
        </section>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          <section className="flex flex-1 flex-col justify-center rounded-card border border-border bg-surface px-5 py-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Taux d&apos;achat</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">{attachPercent}%</p>
            <p className="mt-0.5 text-xs text-ink-2">des clients achètent</p>
          </section>

          <section className="flex flex-1 flex-col justify-center rounded-card border border-border bg-surface px-5 py-5 shadow-card">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Achats</p>
            <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-ink">{gmv.orderCount}</p>
            <p className="mt-0.5 text-xs text-ink-2">
              {gmv.orderCount > 0
                ? `panier moyen ${formatEuros(gmv.averageCents)}`
                : "aucun achat pour l'instant"}
            </p>
          </section>
        </div>
      </div>

      {/* ── Tableau des achats ── */}
      <section className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-ink">Achats</h2>
          {purchases.length > 0 && (
            <span className="rounded-full bg-canvas px-2.5 py-0.5 text-xs font-medium text-ink-2">
              {purchases.length}
            </span>
          )}
        </div>
        <PurchaseTable purchases={purchases} operatorFeePercent={operator.feePercent} />
      </section>
    </main>
  );
}

/* ── Bar chart SVG style Stripe — rendu serveur, zéro JS ── */
function RevenueLineChart({ data, days }: { data: DayRevenue[]; days: number }) {
  const W = 400;
  const H = 80;   // hauteur des barres
  const H_LABEL = 22;
  const MIN_H = 5; // hauteur mini pour les jours avec ventes

  // Remplir tous les jours de la période
  const today = new Date();
  const daily: { date: Date; value: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((x) => x.date === key);
    daily.push({ date: d, value: found?.amountCents ?? 0 });
  }

  const maxVal = Math.max(...daily.map((d) => d.value), 1);
  const n = days;
  const GAP = days <= 7 ? 5 : days <= 14 ? 4 : days <= 30 ? 3 : 2;
  const barW = (W - (n - 1) * GAP) / n;

  // Labels : toujours premier + dernier + quelques intermédiaires
  const LABEL_COUNT = days <= 7 ? n : 5;
  const rawIdx: number[] = [];
  for (let k = 0; k < LABEL_COUNT; k++) {
    rawIdx.push(Math.round((k / (LABEL_COUNT - 1)) * (n - 1)));
  }
  const labelIndices = rawIdx.filter((v, i, arr) => arr.indexOf(v) === i);

  function fmtDate(d: Date) {
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  return (
    <svg viewBox={`0 0 ${W} ${H + H_LABEL}`} className="w-full" aria-hidden>
      {/* Ligne de base */}
      <line x1={0} y1={H} x2={W} y2={H} stroke="var(--border)" strokeWidth="1" />

      {/* Barres */}
      {daily.map(({ value }, i) => {
        const x = i * (barW + GAP);
        if (value === 0) {
          // Jour sans vente : stub discret
          return (
            <rect
              key={i}
              x={x}
              y={H - 3}
              width={barW}
              height={3}
              rx={1.5}
              fill="var(--border)"
            />
          );
        }
        const barH = Math.max(MIN_H, (value / maxVal) * (H - 8));
        return (
          <rect
            key={i}
            x={x}
            y={H - barH}
            width={barW}
            height={barH}
            rx={Math.min(4, barW / 2)}
            fill="var(--accent)"
          />
        );
      })}

      {/* Labels X */}
      {labelIndices.map((idx) => {
        const d = daily[idx]!;
        const x = idx * (barW + GAP) + barW / 2;
        const isLast = idx === n - 1;
        const anchor = idx === 0 ? "start" : isLast ? "end" : "middle";
        return (
          <text key={idx} x={x} y={H + H_LABEL - 4} textAnchor={anchor} fontSize={10} fill="var(--muted)">
            {isLast ? "Auj." : fmtDate(d.date)}
          </text>
        );
      })}
    </svg>
  );
}
