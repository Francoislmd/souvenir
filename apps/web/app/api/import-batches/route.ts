import { prisma } from "@/lib/prisma";
import { getOperatorUser } from "@/lib/current-user";
import { getOrCreateTodaySession } from "@/lib/session";

export async function POST(): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { operator } = dbUser;
    const session = await getOrCreateTodaySession(operator);

    const batch = await prisma.importBatch.create({
      data: { sessionId: session.id },
    });

    return Response.json({ batchId: batch.id }, { status: 201 });
  } catch (error) {
    console.error("[API /api/import-batches]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
