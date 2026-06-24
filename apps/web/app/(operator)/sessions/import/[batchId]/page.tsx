import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { ImportWizard } from "@/components/import/ImportWizard";

export default async function ImportBatchPage({ params }: { params: { batchId: string } }) {
  const { operator } = await requireOperatorUser();

  const batch = await prisma.importBatch.findFirst({
    where: { id: params.batchId, session: { operatorId: operator.id } },
  });

  if (!batch) notFound();

  return (
    <div className="relative">
      {/* Decorative background — fixed pour couvrir tout le viewport */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute -top-24 -right-16 h-[480px] w-[420px] rounded-full blur-[150px]"
          style={{ background: "#7DD3FC", opacity: 0.28 }}
        />
        <div
          className="absolute top-[35%] -left-20 h-[460px] w-[400px] rounded-full blur-[130px]"
          style={{ background: "#4F46E5", opacity: 0.15 }}
        />
        <div
          className="absolute bottom-0 right-0 h-[440px] w-[380px] rounded-full blur-[120px]"
          style={{ background: "#818CF8", opacity: 0.14 }}
        />
      </div>

      <main className="relative z-[1] mx-auto flex w-full max-w-xl flex-col gap-6">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Livraison groupée</h1>
          <p className="mt-1 text-sm text-ink-2">Upload tout le lot, puis répartis les photos par personne.</p>
        </div>

        <ImportWizard batchId={batch.id} operatorName={operator.name} messageTemplate={operator.deliveryMessageTemplate} />
      </main>
    </div>
  );
}
