import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { startOfDay, endOfDay } from "@/lib/dates";
import { NewDeliverySheet } from "@/components/NewDeliverySheet";
import { StatusBadge } from "@/components/StatusBadge";

export default async function SessionsPage() {
  const { operator } = await requireOperatorUser();
  const now = new Date();

  const [session, pastSessions] = await Promise.all([
    prisma.session.findFirst({
      where: { operatorId: operator.id, date: { gte: startOfDay(now), lte: endOfDay(now) } },
      include: { deliveries: { include: { media: true }, orderBy: { createdAt: "desc" } } },
      orderBy: { date: "desc" },
    }),
    prisma.session.findMany({
      where: { operatorId: operator.id, date: { lt: startOfDay(now) } },
      include: { deliveries: { select: { status: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const deliveries = session?.deliveries ?? [];

  return (
    <main className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </h1>
          {session ? (
            <p className="text-sm text-ink-2">
              {session.label ?? "Session du jour"} ·{" "}
              <span className="font-medium text-accent">{session.mode === "BOUTIQUE" ? "Boutique" : "Marketing"}</span>
            </p>
          ) : null}
        </div>
        <div className="md:w-auto">
          <NewDeliverySheet />
        </div>
      </div>

      {deliveries.length === 0 ? (
        <p className="rounded-card border border-border bg-surface p-4 text-sm text-ink-2 shadow-card">
          Aucune livraison aujourd&apos;hui pour l&apos;instant.
        </p>
      ) : (
        <section className="rounded-card border border-border bg-surface p-4 shadow-card md:p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">{session?.label ?? "Session du jour"}</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-tint px-2.5 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {deliveries.length} livraison{deliveries.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Desktop : table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-ink-2">
                  <th className="px-2 py-2">Code</th>
                  <th className="px-2 py-2">Médias</th>
                  <th className="px-2 py-2">Statut</th>
                  <th className="px-2 py-2">Galerie</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery) => {
                  const videoCount = delivery.media.filter((media) => media.kind === "VIDEO").length;
                  const failedCount = delivery.media.filter((media) => media.status === "FAILED").length;
                  return (
                    <tr key={delivery.id} className="border-b border-border last:border-0">
                      <td className="px-2 py-3 font-mono text-xs font-semibold text-ink">{delivery.code}</td>
                      <td className="px-2 py-3 text-ink-2">
                        {delivery.media.length}
                        {videoCount > 0 ? ` + ${videoCount} 🎬` : ""}
                        {failedCount > 0 ? (
                          <span className="ml-1 text-danger">
                            · {failedCount} échec{failedCount > 1 ? "s" : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-2 py-3">
                        <StatusBadge status={delivery.status} />
                      </td>
                      <td className="px-2 py-3 font-mono text-xs text-accent">/g/{delivery.code}</td>
                      <td className="px-2 py-3 text-right">
                        <Link
                          href={`/sessions/${delivery.id}`}
                          className="rounded-control border border-border px-3 py-1.5 text-xs font-medium text-ink transition hover:border-border-strong"
                        >
                          {failedCount > 0 ? "↺ réessayer" : "QR"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile : liste */}
          <ul className="flex flex-col gap-2 md:hidden">
            {deliveries.map((delivery) => (
              <li key={delivery.id}>
                <Link
                  href={`/sessions/${delivery.id}`}
                  className="flex items-center justify-between gap-3 rounded-card bg-canvas px-4 py-4 transition active:scale-[0.99]"
                >
                  <div className="flex flex-col">
                    <span className="text-lg font-semibold tracking-wide text-ink">{delivery.code}</span>
                    <span className="text-xs text-ink-2">
                      {delivery.media.length} média{delivery.media.length > 1 ? "s" : ""}
                      {delivery.clientName ? ` · ${delivery.clientName}` : ""}
                    </span>
                  </div>
                  <StatusBadge status={delivery.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pastSessions.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-ink-2">Sessions précédentes</h2>
          {pastSessions.map((past) => {
            const purchased = past.deliveries.filter((delivery) => delivery.status === "PURCHASED").length;
            return (
              <div key={past.id} className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{past.label ?? "Session"}</p>
                  <p className="text-xs text-ink-2">{past.date.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
                </div>
                <span className="rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-2">
                  {past.deliveries.length} livraison{past.deliveries.length > 1 ? "s" : ""} · {purchased} payée
                  {purchased === 1 ? "" : "s"}
                </span>
              </div>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
