import { requireOperatorUser } from "@/lib/current-user";
import { Sidebar } from "@/components/operator/Sidebar";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/brand/Logo";
import { HeaderTitle } from "@/components/operator/HeaderTitle";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";
import { ToastProvider } from "@/components/operator/ToastProvider";
import styles from "./operator.module.css";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;

  return (
    <ToastProvider>
      <div className={styles.app}>
        <Sidebar operatorName={operator.name} />

        <div className={styles.main}>
          <header className={styles.hdr}>
            <span className={styles["hdr-logo"]}>
              <Logo height={34} />
            </span>
            <HeaderTitle />
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

        <BottomNav />
      </div>
    </ToastProvider>
  );
}
