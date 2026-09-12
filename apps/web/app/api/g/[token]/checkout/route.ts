import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { createOrUpdatePaymentIntent, CheckoutError } from "@/lib/checkout";

const schema = z.object({
  photoIds: z.array(z.string()).default([]),
});

/**
 * Ouverture du paiement pour une galerie individuelle.
 *
 * Clé sur le TOKEN, jamais sur le participantId. L'ancienne route
 * `/api/checkout` prenait un `participantId` brut, sans authentification —
 * or ce participantId est sérialisé dans le payload RSC de la page publique
 * `/g/[token]`. N'importe qui ayant vu passer un lien de galerie pouvait
 * rappeler la route et faire repasser la commande en `pending` (voir l'upsert
 * dans lib/checkout.ts), ce qui reverrouille la galerie d'un client qui a
 * déjà payé. Le token est le seul secret du parcours client : c'est lui qui
 * doit porter l'autorisation, comme partout ailleurs sous /g/[token].
 */
export async function POST(request: Request, { params }: { params: { token: string } }): Promise<Response> {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const participant = await prisma.participant.findUnique({
      where: { token: params.token },
      select: { id: true, deletedAt: true, sortie: { select: { operatorId: true } } },
    });
    if (!participant || participant.deletedAt) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const { clientSecret, amountCents } = await createOrUpdatePaymentIntent({
      participantId: participant.id,
      photoIds: parsed.data.photoIds,
    });

    await track("checkout_started", { operatorId: participant.sortie.operatorId, participantId: participant.id });

    return Response.json({ clientSecret, amountCents }, { status: 200 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      const status = error.code === "not_found" ? 404 : 409;
      return Response.json({ error: error.code }, { status });
    }
    console.error("[API /api/g/[token]/checkout]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
