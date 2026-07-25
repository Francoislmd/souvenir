import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { env } from "@/lib/env";
import { getOperatorUser } from "@/lib/current-user";
import { sendGroupInviteEmail } from "@/lib/email";

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
});

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

// "Envoyer au groupe" (mode GROUPE) — une liste d'emails saisie à la main
// par l'opérateur, pas des Participant existants (personne n'est encore
// identifié avant achat). Chaque envoi est indépendant.
export async function POST(request: Request, { params }: { params: { sortieId: string } }): Promise<Response> {
  try {
    const dbUser = await getOperatorUser();
    if (!dbUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const sortie = await prisma.sortie.findFirst({
      where: { id: params.sortieId, operatorId: dbUser.operatorId },
      include: { operator: true },
    });
    if (!sortie || sortie.mode !== "GROUPE" || !sortie.operator.shareToken) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const galleryUrl = `${env.NEXT_PUBLIC_APP_URL}/g/s/${sortie.operator.shareToken}`;
    const emails = Array.from(new Set(parsed.data.emails.map((e) => e.trim().toLowerCase())));

    let sent = 0;
    for (const to of emails) {
      try {
        await sendGroupInviteEmail({
          to,
          operatorId: sortie.operatorId,
          operatorName: sortie.operator.name,
          operatorLogoUrl: sortie.operator.logoUrl,
          brandColor: sortie.operator.brandColor,
          activity: sortie.activity,
          sortieDate: formatDateFr(sortie.startsAt),
          sortiePlace: sortie.place,
          galleryUrl,
        });
        sent += 1;
      } catch (error) {
        console.error("[API /api/sorties/[sortieId]/invite] send failed for", to, error);
      }
    }

    await track("group_invite_sent", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, sent, total: emails.length } });

    return Response.json({ sent, total: emails.length }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/invite]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
