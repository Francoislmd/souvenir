import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";
import { DeliveryQr } from "@/components/DeliveryQr";
import { NewDeliverySheet } from "@/components/NewDeliverySheet";

export default async function DeliveryQrPage({ params }: { params: { deliveryId: string } }) {
  const { operator } = await requireOperatorUser();

  const delivery = await prisma.delivery.findFirst({
    where: { id: params.deliveryId, session: { operatorId: operator.id } },
  });

  if (!delivery) notFound();

  await track("qr_displayed", { operatorId: operator.id, deliveryId: delivery.id });

  const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/${delivery.token}`;
  const shortLink = `${new URL(env.NEXT_PUBLIC_APP_URL).host}/g/${delivery.code}`;

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-6 text-center">
      <p className="text-sm font-medium text-ink-2">Montre cet écran au client</p>

      <DeliveryQr url={galleryUrl} />

      <p className="text-2xl font-semibold tracking-[0.1em] text-ink">{shortLink}</p>

      <p className="max-w-xs text-sm text-ink-2">
        Le client scanne ce QR : sa galerie s&rsquo;ouvre directement. En plein soleil, il peut aussi taper{" "}
        <span className="font-semibold text-ink">{shortLink}</span> dans son navigateur.
      </p>

      <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
        <NewDeliverySheet />
        <Link href="/sessions" className="py-2 text-center text-sm font-medium text-ink-2 hover:text-ink">
          Retour aux sessions
        </Link>
      </div>
    </main>
  );
}
