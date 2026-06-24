import { requireOperatorUser } from "@/lib/current-user";
import { BottomNav } from "@/components/BottomNav";
import { Sidebar } from "@/components/operator/Sidebar";
import { LogoMark } from "@/components/brand/Logo";
import { StripeSyncBanner } from "@/components/operator/StripeSyncBanner";

export default async function OperatorLayout({ children }: { children: React.ReactNode }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const isAdmin = dbUser.role === "ADMIN";

  return (
    <div className="min-h-screen bg-canvas pb-20 md:flex md:pb-0">
      <Sidebar isAdmin={isAdmin} operatorName={operator.name} stripeOnboarded={operator.stripeOnboarded} />

      <div className="flex min-h-screen flex-1 flex-col">
        {!operator.stripeOnboarded && <StripeSyncBanner />}

        <div className="mx-auto w-full max-w-xl px-4 md:max-w-none md:px-8">
          <header className="flex items-center justify-between border-b border-border py-4 md:hidden">
            <div className="flex items-center gap-3">
              <LogoMark className="h-8 w-8 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-semibold text-ink">{operator.name}</span>
                <span className="text-[11px] text-ink-2">via Souvenir</span>
              </div>
            </div>
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-ink-2 hover:text-ink">
                Déconnexion
              </button>
            </form>
          </header>

          <div className="hidden items-center justify-end border-b border-border py-3 md:flex">
            <form action="/auth/signout" method="post">
              <button type="submit" className="text-sm text-ink-2 hover:text-ink">
                Déconnexion
              </button>
            </form>
          </div>

          <div className="py-6">{children}</div>
        </div>
      </div>

      <BottomNav isAdmin={isAdmin} />
    </div>
  );
}
