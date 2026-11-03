import { requireOperatorUser } from "@/lib/current-user";
import { ReglagesForm } from "@/components/reglages/ReglagesForm";
import { readAutomations } from "@/lib/automations";
import { storeHomeUrl } from "@/lib/store";
import { prisma } from "@/lib/prisma";

export default async function ReglagesPage({ searchParams }: { searchParams: { code?: string } }) {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;
  const automations = readAutomations(operator.automations);
  const feeCode = await prisma.feeWaiverCode.findUnique({ where: { operatorId: operator.id }, select: { id: true } });

  return (
    <ReglagesForm
      // Retour d'un lien /code/{code} ouvert en étant connecté.
      codeNotice={searchParams.code ?? null}
      storeUrl={storeHomeUrl(operator.slug)}
      operator={{
        name: operator.name,
        logoUrl: operator.logoUrl,
        coverUrl: operator.coverUrl,
        brandColor: operator.brandColor,
        tagline: operator.tagline,
        pricePhotoCents: operator.pricePhotoCents,
        priceAllCents: operator.priceAllCents,
        packOnly: operator.packOnly,
        feePercent: operator.feePercent,
        feeWaiverDays: operator.feeWaiverDays,
        feeWaivedUntil: operator.feeWaivedUntil?.toISOString() ?? null,
        feeCodeUsed: !!feeCode,
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
