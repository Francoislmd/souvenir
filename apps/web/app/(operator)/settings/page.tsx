import { requireAdminUser } from "@/lib/current-user";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { StripeConnectSection } from "@/components/settings/StripeConnectSection";

export default async function SettingsPage() {
  const { operator } = await requireAdminUser();

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Réglages</h1>
        <p className="mt-1 text-sm text-ink-2">Marque, prix, mode et liens — réglables à tout moment.</p>
      </div>

      <StripeConnectSection stripeAccountId={operator.stripeAccountId} stripeOnboarded={operator.stripeOnboarded} />

      <SettingsForm operator={operator} />
    </main>
  );
}
