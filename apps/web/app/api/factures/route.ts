import { z } from "zod";
import { getOperatorUser } from "@/lib/current-user";
import { generateInvoices, InvoicingNotReadyError } from "@/lib/invoicing";

// Une facture appelle Stripe une fois par vente : un mois chargé prend
// quelques dizaines de secondes.
export const maxDuration = 120;

const body = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Générer maintenant la facture d'une période choisie par le pro (onglet
// Factures). Seules les ventes pas encore facturées y figurent, une facture
// par mois civil.
export async function POST(request: Request): Promise<Response> {
  const user = await getOperatorUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Choisissez deux dates." }, { status: 400 });
  if (parsed.data.from > parsed.data.to) {
    return Response.json({ error: "La date de début doit précéder la date de fin." }, { status: 400 });
  }

  try {
    const ids = await generateInvoices(user.operatorId, parsed.data.from, parsed.data.to);
    return Response.json({ created: ids.length });
  } catch (error) {
    if (error instanceof InvoicingNotReadyError) {
      return Response.json({ error: "La facturation n’est pas encore ouverte." }, { status: 409 });
    }
    if (error instanceof RangeError) return Response.json({ error: "Période invalide." }, { status: 400 });
    console.error("[factures] génération impossible", error);
    return Response.json({ error: "La facture n’a pas pu être créée. Réessayez dans un instant." }, { status: 502 });
  }
}
