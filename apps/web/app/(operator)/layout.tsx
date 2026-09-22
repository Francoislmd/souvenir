import type { Viewport } from "next";
import { requireOperatorUser } from "@/lib/current-user";
import { Sidebar } from "@/components/operator/Sidebar";
import { MobileTopBar } from "@/components/operator/MobileTopBar";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";
import { ToastProvider } from "@/components/operator/ToastProvider";
import { UploadQueueProvider } from "@/components/photos/UploadQueueProvider";
import { ScrollRoot } from "@/components/operator/ScrollRoot";
import { storeHomeUrl } from "@/lib/store";
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

  return (
    <ToastProvider>
      {/* La file d'envoi des photos est montée ici, pas dans l'écran d'une
          sortie : l'opérateur dépose ses photos et repart travailler ailleurs
          dans son espace, le transfert continue. */}
      <UploadQueueProvider>
        <div className={styles.app} id="app-root">
          <Sidebar
            operatorName={operator.name}
            email={dbUser.email}
            logoUrl={operator.logoUrl}
            storeHref={storeHomeUrl(operator.slug)}
          />

          <ScrollRoot>
            {!operator.stripeOnboarded ? <StripeSyncBanner /> : null}
            {/* Le logo et le compte, que la barre d'onglets basse ne peut pas
                porter. Invisible au-dessus de 760 px : la colonne de gauche
                s'en charge. */}
            <MobileTopBar operatorName={operator.name} email={dbUser.email} />
            <div className={styles.content}>{children}</div>
          </ScrollRoot>
        </div>
      </UploadQueueProvider>
    </ToastProvider>
  );
}
