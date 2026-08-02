import type { Viewport } from "next";
import { requireOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/dates";
import { Sidebar } from "@/components/operator/Sidebar";
import { MobileNavDrawer } from "@/components/operator/MobileNavDrawer";
import { HeaderTitle } from "@/components/operator/HeaderTitle";
import { TopbarSearch } from "@/components/operator/TopbarSearch";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";
import { ToastProvider } from "@/components/operator/ToastProvider";
import { Logo } from "@/components/brand/Logo";
import styles from "./operator.module.css";

// viewport-fit=cover pour ce segment uniquement (pas le site marketing / la
// boutique client) : le tiroir mobile a besoin de env(safe-area-inset-*)
// pour ne pas laisser de bande sous l'encoche/la barre d'état iOS.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const now = new Date();

  // Sorties du jour pas encore envoyées aux clients — c'est ce qui reste
  // « à traiter » pour l'opérateur.
  const badgeCount = await prisma.sortie.count({
    where: {
      operatorId: operator.id,
      startsAt: { gte: startOfDay(now), lte: endOfDay(now) },
      status: { not: "SENT" },
    },
  });

  return (
    <ToastProvider>
      <div className={styles.app} id="app-root">
        <Sidebar operatorName={operator.name} badgeCount={badgeCount} />

        <div className={styles.main}>
          <header className={styles.hdr}>
            <MobileNavDrawer operatorName={operator.name} badgeCount={badgeCount} />
            <span className={styles["hdr-logo"]}>
              <Logo variant="symbol" height={30} />
            </span>
            <HeaderTitle />
            <TopbarSearch />
            <span className={styles.hsp} />
            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.acct} aria-label="Se déconnecter">
                {operator.name.slice(0, 2).toUpperCase()}
              </button>
            </form>
          </header>

          {!operator.stripeOnboarded ? <StripeSyncBanner /> : null}

          <div className={styles.content}>{children}</div>
        </div>

        {/* Cible du portal du tiroir mobile — sœur de <header>, donc hors de
            son backdrop-filter (qui casse position:fixed), mais toujours
            enfant de .app pour hériter les tokens (--ink, --side, etc.),
            définis sur .app et pas sur :root. */}
        <div id="mobile-drawer-root" />
      </div>
    </ToastProvider>
  );
}
