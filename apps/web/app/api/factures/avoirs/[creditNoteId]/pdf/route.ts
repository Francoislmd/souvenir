import { getOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function GET(_request: Request, { params }: { params: { creditNoteId: string } }): Promise<Response> {
  const user = await getOperatorUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const note = await prisma.invoiceCreditNote.findFirst({
    where: { id: params.creditNoteId, invoice: { operatorId: user.operatorId } },
    select: { stripeCreditNoteId: true },
  });
  if (!note) return Response.json({ error: "Avoir introuvable." }, { status: 404 });

  const creditNote = await stripe.creditNotes.retrieve(note.stripeCreditNoteId);
  return Response.redirect(creditNote.pdf, 302);
}
