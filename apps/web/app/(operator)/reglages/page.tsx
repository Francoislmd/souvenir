import { requireOperatorUser } from "@/lib/current-user";
import { ReglagesForm } from "@/components/reglages/ReglagesForm";
import { readAutomations } from "@/lib/automations";
import { storeHomeUrl } from "@/lib/store";

export default async function ReglagesPage() {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const automations = readAutomations(operator.automations);

  return (
    <ReglagesForm
      storeUrl={storeHomeUrl(operator.slug)}
      operator={{
        name: operator.name,
        logoUrl: operator.logoUrl,
        coverUrl: operator.coverUrl,
        brandColor: operator.brandColor,
        pricePhotoCents: operator.pricePhotoCents,
        priceAllCents: operator.priceAllCents,
        packOnly: operator.packOnly,
        feePercent: operator.feePercent,
        stripeOnboarded: operator.stripeOnboarded,
        activities: operator.activities,
        legalName: operator.legalName ?? "",
        legalAddress: operator.legalAddress ?? "",
        siret: operator.siret ?? "",
        vatExempt: operator.vatExempt,
        automations: {
          resendUnopened: automations.resendUnopened,
          reducedPriceOffer: automations.reducedPriceOffer,
          reviewRequest: automations.reviewRequest,
        },
      }}
    />
  );
}
