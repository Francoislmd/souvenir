import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";

export async function GET(_request: Request, { params }: { params: { deliveryId: string } }): Promise<Response> {
  const dbUser = await getOperatorUser();
  if (!dbUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const delivery = await prisma.delivery.findFirst({
    where: { id: params.deliveryId, session: { operatorId: dbUser.operatorId } },
    include: { media: { select: { id: true, status: true } } },
  });

  if (!delivery) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ media: delivery.media }, { status: 200 });
}
