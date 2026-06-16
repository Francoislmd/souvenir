import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { getOrCreateTodaySession } from "@/lib/session";
import { generateUniqueCode } from "@/lib/delivery-code";

export async function POST(): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operator } = dbUser;
    const session = await getOrCreateTodaySession(operator);
    const code = await generateUniqueCode();

    const delivery = await prisma.delivery.create({
      data: {
        sessionId: session.id,
        code,
        token: crypto.randomUUID(),
      },
    });

    await track("delivery_created", { operatorId: operator.id, deliveryId: delivery.id });

    return Response.json({ deliveryId: delivery.id, code: delivery.code }, { status: 201 });
  } catch (error) {
    console.error("[API /api/deliveries]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
