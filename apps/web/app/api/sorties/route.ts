import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { track } from "@/lib/analytics";
import { getOperatorUser } from "@/lib/current-user";
import { ensureShareCode } from "@/lib/store";
import { deriveChannel } from "@/lib/channel";
import { nameFromEmail } from "@/lib/emails";
import { parsePhone } from "@/lib/phone";

const DAY_MS = 24 * 60 * 60 * 1000;

const schema = z.object({
  activity: z.string().min(1),
  place: z.string().min(1).nullable().optional(),
  startsAt: z.string().min(1),
  seats: z.number().int().min(1).default(8),
  guide: z.string().min(1).nullable().optional(),
  mode: z.enum(["INDIVIDUEL", "GROUPE"]).default("INDIVIDUEL"),
  // Au moins un client joignable : une sortie sans adresse ni numéro ne peut
  // rien vendre (galerie privée, l'e-mail ou le numéro est l'identifiant).
  contacts: z.array(z.string().trim().min(1).max(254)).min(1, "Ajoutez un e-mail ou un numéro").max(200),
});

/** E-mail en minuscules ou numéro en E.164, null si ce n'est ni l'un ni l'autre. */
function normalizeContact(raw: string): string | null {
  if (raw.includes("@")) {
    const email = raw.toLowerCase();
    return z.string().email().safeParse(email).success ? email : null;
  }
  return parsePhone(raw);
}

export async function POST(request: Request): Promise<Response> {
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

    const normalized = parsed.data.contacts.map(normalizeContact);
    if (normalized.some((c) => c === null)) {
      return Response.json({ error: "Adresse ou numéro invalide" }, { status: 400 });
    }
    const contacts = Array.from(new Set(normalized as string[]));

    // La sortie et ses clients naissent ensemble : ils attendent sans `sentAt`,
    // et la publication (sendPendingInvites) ou l'envoi leur adresse le lien.
    const now = new Date();
    const sortie = await prisma.sortie.create({
      data: {
        operatorId: dbUser.operatorId,
        activity: parsed.data.activity,
        place: parsed.data.place,
        startsAt: new Date(parsed.data.startsAt),
        seats: parsed.data.seats,
        guide: parsed.data.guide,
        mode: parsed.data.mode,
        participants: {
          create: contacts.map((contact) => ({
            name: nameFromEmail(contact),
            contact,
            channel: deriveChannel(contact),
            token: crypto.randomUUID(),
            consentAt: now,
            deleteAt: new Date(now.getTime() + 90 * DAY_MS),
          })),
        },
      },
    });

    // Une sortie GROUPE a sa propre boutique, store.linktrip.co/{slug}/{code} :
    // le code naît avec elle, pour que le QR code soit affichable sans attendre
    // la publication des photos.
    if (sortie.mode === "GROUPE") {
      await ensureShareCode(sortie);
    }

    await track("sortie_created", { operatorId: dbUser.operatorId, meta: { sortieId: sortie.id, contacts: contacts.length } });

    return Response.json({ sortieId: sortie.id }, { status: 201 });
  } catch (error) {
    console.error("[API /api/sorties]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
