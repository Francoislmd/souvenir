import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { deriveChannel } from "@/lib/channel";
import { nameFromEmail } from "@/lib/emails";
import { departureKnown, departuresWithPhotos, sendPrivateInvite } from "@/lib/private-link";
import { buildEmailCover } from "@/lib/email-cover";

const DAY_MS = 24 * 60 * 60 * 1000;

// Jusqu'à 200 envois Resend à la suite : la durée par défaut ne suffit pas.
export const maxDuration = 60;

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
});

/**
 * Ce que l'opérateur lit quand Resend refuse. Les deux causes connues sont
 * de configuration, pas de saisie : elles se règlent dans Resend, pas en
 * réessayant.
 */
function sendFailureReason(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (/testing emails|verify a domain|domain is not verified/i.test(msg)) {
    return "Resend refuse l'adresse d'expédition : le domaine n'est pas vérifié (en test, Resend n'écrit qu'au titulaire du compte).";
  }
  if (/rate_limit|quota|too many/i.test(msg)) {
    return "Quota d'envoi Resend atteint, réessayez plus tard.";
  }
  if (/RESEND_API_KEY|api key/i.test(msg)) {
    return "Clé Resend absente ou invalide.";
  }
  return msg;
}

/**
 * Envoyer à une liste d'adresses leur galerie privée (mode GROUPE).
 *
 * Chaque adresse devient un Participant, marqué `sentAt` : c'est ce qui la
 * fait apparaître dans « Vos clients » avec l'état « Envoyé ». Avant, l'envoi
 * ne laissait aucune trace et l'opérateur ne savait plus à qui il avait écrit.
 * Chaque client choisit son départ à la première ouverture de son lien.
 *
 * Réenvoyer à une adresse déjà présente ne la duplique pas.
 */
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
    if (!sortie || sortie.mode !== "GROUPE") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const emails = Array.from(new Set(parsed.data.emails.map((e) => e.trim().toLowerCase())));

    // Un bandeau par envoi, partagé par tous les destinataires.
    const coverUrl = await buildEmailCover(sortie.id);
    const now = new Date();
    // Plusieurs départs : l'adresse est ajoutée à la liste, et son lien part
    // quand le prestataire indique son départ (api/participants/[id]/slot).
    const departureCount = sortie.status === "SENT" ? (await departuresWithPhotos(sortie.id)).length : 0;
    let sent = 0;
    let waiting = 0;
    let failure: string | null = null;
    for (const to of emails) {
      try {
        // Une ligne par adresse, réutilisée si elle existe déjà : l'opérateur
        // qui renvoie à toute sa liste ne doit pas la voir doubler.
        const existing = await prisma.participant.findFirst({
          where: { sortieId: sortie.id, contact: { equals: to, mode: "insensitive" }, deletedAt: null },
          select: { id: true, token: true, contact: true, slotId: true },
        });
        const participant =
          existing ??
          (await prisma.participant.create({
            data: {
              sortieId: sortie.id,
              name: nameFromEmail(to),
              contact: to,
              channel: deriveChannel(to),
              token: crypto.randomUUID(),
              consentAt: now,
              deleteAt: new Date(now.getTime() + 90 * DAY_MS),
            },
            select: { id: true, token: true, contact: true, slotId: true },
          }));

        if (!departureKnown(participant, departureCount)) {
          waiting += 1;
          continue;
        }
        // Chacun reçoit SA galerie : le lien n'ouvre que son départ.
        await sendPrivateInvite(participant, sortie, coverUrl);
        sent += 1;
      } catch (error) {
        console.error("[API /api/sorties/[sortieId]/invite] send failed for", to, error);
        failure ??= sendFailureReason(error);
      }
    }

    await track("group_invite_sent", { operatorId: sortie.operatorId, meta: { sortieId: sortie.id, sent, waiting, total: emails.length } });

    // Rien n'est parti : ce n'est pas un succès. Avant, la route répondait 200
    // quoi qu'il arrive et l'écran annonçait « Lien envoyé » sur un refus de Resend.
    if (sent === 0 && waiting === 0) {
      return Response.json({ sent, waiting, total: emails.length, error: failure ?? "L'envoi a échoué." }, { status: 502 });
    }
    return Response.json({ sent, waiting, total: emails.length, ...(failure ? { error: failure } : {}) }, { status: 200 });
  } catch (error) {
    console.error("[API /api/sorties/[sortieId]/invite]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
