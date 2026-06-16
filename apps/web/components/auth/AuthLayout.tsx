import { Logo } from "@/components/brand/Logo";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-12">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <Logo markClassName="h-10 w-10" textClassName="text-xl" />
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-6 text-center shadow-card sm:p-8">
          {children}
        </div>
      </div>
    </main>
  );
}
