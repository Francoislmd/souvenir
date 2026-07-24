import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "@/components/OnboardingForm";
import { Logo } from "@/components/brand/Logo";

export default async function OnboardingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) redirect("/connexion");

  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) redirect("/sorties");

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-6 py-12">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <Logo height={40} />
        </div>

        <div className="mt-8 rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          <h1 className="font-display text-2xl font-extrabold text-ink">Bienvenue sur Linktrip 👋</h1>
          <p className="mt-2 text-sm text-ink-2">
            Quelques infos sur votre activité pour préparer vos sorties et votre boutique.
          </p>
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
