import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getZipSignedUrl } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { token: params.token },
      include: { session: true },
    });
    if (!delivery || delivery.status !== "PURCHASED") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const signedUrl = await getZipSignedUrl(delivery.id);
    if (!signedUrl) {
      return Response.json({ error: "not_ready" }, { status: 202 });
    }

    await track("zip_downloaded", { operatorId: delivery.session.operatorId, deliveryId: delivery.id });

    return Response.redirect(signedUrl, 302);
  } catch (error) {
    console.error("[API /api/gallery/[token]/zip]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
