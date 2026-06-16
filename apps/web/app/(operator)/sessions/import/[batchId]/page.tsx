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
    <main className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Livraison groupée</h1>
        <p className="text-sm text-ink-2">Upload tout le lot, puis répartis les photos par personne.</p>
      </div>

      <ImportWizard batchId={batch.id} operatorName={operator.name} messageTemplate={operator.deliveryMessageTemplate} />
    </main>
  );
}
