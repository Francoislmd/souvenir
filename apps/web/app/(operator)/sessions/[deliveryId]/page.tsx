import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { DeliveryUploadSection } from "@/components/DeliveryUploadSection";
import { DeliverySendForm } from "@/components/DeliverySendForm";

export default async function DeliveryUploadPage({ params }: { params: { deliveryId: string } }) {
  const { operator } = await requireOperatorUser();

  const delivery = await prisma.delivery.findFirst({
    where: { id: params.deliveryId, session: { operatorId: operator.id } },
  });

  if (!delivery) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Livraison {delivery.code}</h1>
        <p className="text-sm text-ink-2">Prépare et envoie les souvenirs de ce vol.</p>
      </div>

      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent">
            1
          </span>
          <h2 className="text-base font-semibold text-ink">Ajoute les photos et la vidéo</h2>
        </div>
        <DeliveryUploadSection deliveryId={delivery.id} />
      </section>

      <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint text-sm font-bold text-accent">
            2
          </span>
          <h2 className="text-base font-semibold text-ink">Envoie les souvenirs au client</h2>
        </div>
        <DeliverySendForm
          deliveryId={delivery.id}
          operatorName={operator.name}
          messageTemplate={operator.deliveryMessageTemplate}
          initialName={delivery.clientName}
          initialEmail={delivery.clientEmail}
          initialPhone={delivery.clientPhone}
          initialTitle={delivery.title}
        />
        <p className="text-center text-xs text-ink-2">
          Tu peux envoyer même si l&apos;upload n&apos;est pas fini, la galerie se complète tout seule.
        </p>
      </section>

      <Link href={`/sessions/${delivery.id}/qr`} className="py-2 text-center text-sm font-medium text-ink-2 hover:text-ink">
        Ou afficher directement le QR sans envoyer
      </Link>
    </main>
  );
}
