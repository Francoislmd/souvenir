import { OnboardingWizard } from "@/components/OnboardingWizard";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { name?: string };
}) {
  // Humanize the slug if it came from HeroForm (e.g. "vol-passion-annecy" → "Vol Passion Annecy")
  const raw = searchParams.name ?? "";
  const initialName = raw.includes("-") || raw === raw.toLowerCase()
    ? raw
        .split(/[-\s]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : raw;

  return <OnboardingWizard initialName={initialName} />;
}
