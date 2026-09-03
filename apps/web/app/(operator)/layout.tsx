import type { Viewport } from "next";
import { requireOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { startOfMonth } from "@/lib/dates";
import { Sidebar } from "@/components/operator/Sidebar";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";
import { ToastProvider } from "@/components/operator/ToastProvider";
import styles from "./operator.module.css";

// viewport-fit=cover pour ce segment uniquement : la barre de navigation
// basse du téléphone a besoin de env(safe-area-inset-bottom).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;

  // Le compteur du menu affiche le nombre de sorties du mois, pas un rappel
  // d'action : la sortie qui attend ses photos porte son propre bouton dans
  // la liste, un badge en plus ferait doublon.
  const monthCount = await prisma.sortie.count({
    where: { operatorId: operator.id, startsAt: { gte: startOfMonth(new Date()) } },
  });

  return (
    <ToastProvider>
      <div className={styles.app} id="app-root">
        <Sidebar operatorName={operator.name} badgeCount={monthCount} />

        <div className={styles.main}>
          {!operator.stripeOnboarded ? <StripeSyncBanner /> : null}
          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </ToastProvider>
  );
}
