import { requireOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "@/lib/dates";
import { Sidebar } from "@/components/operator/Sidebar";
import { MobileNavDrawer } from "@/components/operator/MobileNavDrawer";
import { HeaderTitle } from "@/components/operator/HeaderTitle";
import { TopbarSearch } from "@/components/operator/TopbarSearch";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";
import { ToastProvider } from "@/components/operator/ToastProvider";
import styles from "./operator.module.css";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const now = new Date();

  // Sorties du jour pas encore envoyées aux clients — même logique que ce
  // que TodaySorties met déjà en avant comme « à traiter ».
  const badgeCount = await prisma.sortie.count({
    where: {
      operatorId: operator.id,
      startsAt: { gte: startOfDay(now), lte: endOfDay(now) },
      status: { not: "SENT" },
    },
  });

  return (
    <ToastProvider>
      <div className={styles.app}>
        <Sidebar operatorName={operator.name} badgeCount={badgeCount} />

        <div className={styles.main}>
          <header className={styles.hdr}>
            <MobileNavDrawer operatorName={operator.name} badgeCount={badgeCount} />
            <span className={styles["hdr-logo"]}>{operator.name.slice(0, 2).toUpperCase()}</span>
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
      </div>
    </ToastProvider>
  );
}
