import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { deriveChannel } from "@/lib/channel";
import { createOrUpdatePaymentIntent, CheckoutError } from "@/lib/checkout";

const DAY_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  email: z.string().email("Une adresse email valide est requise"),
  photoIds: z.array(z.string()).default([]),
});

// Public, non authentifié — c'est ici, et seulement ici, qu'on apprend
// l'identité du client en mode GROUPE (brief §3.3). Un Participant est créé
// à la volée, rattaché au slot plutôt qu'à des photos possédées en propre,
// pour réutiliser tel quel le pipeline de paiement existant.
export async function POST(request: Request, { params }: { params: { shareToken: string; slotId: string } }): Promise<Response> {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.findUnique({ where: { shareToken: params.shareToken } });
    if (!sortie || sortie.mode !== "GROUPE") {
      return Response.json({ error: "not_found" }, { status: 404 });
    }
    const slot = await prisma.slot.findFirst({ where: { id: params.slotId, sortieId: sortie.id } });
    if (!slot) {
      return Response.json({ error: "not_found" }, { status: 404 });
    }

    const email = parsed.data.email.trim();
    const now = new Date();
    const participant = await prisma.participant.create({
      data: {
        sortieId: sortie.id,
        slotId: slot.id,
        name: email.split("@")[0] ?? "Client",
        contact: email,
        channel: deriveChannel(email),
        token: crypto.randomUUID(),
        consentAt: now,
        deleteAt: new Date(now.getTime() + 90 * DAY_MS),
      },
    });

    const { clientSecret, amountCents } = await createOrUpdatePaymentIntent({
      participantId: participant.id,
      photoIds: parsed.data.photoIds,
    });

    await track("group_order_created", { operatorId: sortie.operatorId, participantId: participant.id, meta: { slotId: slot.id } });

    return Response.json({ participantId: participant.id, token: participant.token, clientSecret, amountCents }, { status: 200 });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return Response.json({ error: error.code }, { status: error.code === "not_found" ? 404 : 409 });
    }
    console.error("[API /api/g/s/[shareToken]/slots/[slotId]/checkout]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
