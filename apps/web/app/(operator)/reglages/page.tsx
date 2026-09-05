import { requireOperatorUser } from "@/lib/current-user";
import { ReglagesForm } from "@/components/reglages/ReglagesForm";
import { readAutomations } from "@/lib/automations";

export default async function ReglagesPage() {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const automations = readAutomations(operator.automations);

  return (
    <ReglagesForm
      operator={{
        name: operator.name,
        logoUrl: operator.logoUrl,
        brandColor: operator.brandColor,
        pricePhotoCents: operator.pricePhotoCents,
        priceAllCents: operator.priceAllCents,
        packOnly: operator.packOnly,
        feePercent: operator.feePercent,
        stripeOnboarded: operator.stripeOnboarded,
        activities: operator.activities,
        automations: {
          resendUnopened: automations.resendUnopened,
          reducedPriceOffer: automations.reducedPriceOffer,
          reviewRequest: automations.reviewRequest,
        },
      }}
    />
  );
}
