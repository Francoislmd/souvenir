import { requireAdminUser } from "@/lib/current-user";
import { SettingsLayout } from "@/components/settings/SettingsLayout";

export default async function SettingsPage() {
  const { operator } = await requireAdminUser();
  return <SettingsLayout operator={operator} />;
}
