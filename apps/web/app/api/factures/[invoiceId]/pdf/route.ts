import { getOperatorUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

// Le PDF est celui de Stripe, qui garde l'original. Son lien est redemandé à
// chaque ouverture plutôt que stocké : il n'a pas à vivre dans notre base.
export async function GET(_request: Request, { params }: { params: { invoiceId: string } }): Promise<Response> {
  const user = await getOperatorUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, operatorId: user.operatorId, status: "paid" },
    select: { stripeInvoiceId: true },
  });
  if (!invoice?.stripeInvoiceId) return Response.json({ error: "Facture introuvable." }, { status: 404 });

  const stripeInvoice = await stripe.invoices.retrieve(invoice.stripeInvoiceId);
  if (!stripeInvoice.invoice_pdf) return Response.json({ error: "PDF indisponible." }, { status: 502 });
  return Response.redirect(stripeInvoice.invoice_pdf, 302);
}
