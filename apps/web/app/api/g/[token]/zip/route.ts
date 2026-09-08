import { prisma } from "@/lib/prisma";
import { downloadOriginal } from "@/lib/storage";
import { zipStream, slugForFilename, type ZipEntrySource } from "@/lib/zip";

// Le zip se fabrique à la volée, photo par photo : il n'existe à aucun
// moment en entier, ni en mémoire ni sur disque. La durée, elle, dépend du
// nombre de photos et du débit du stockage — d'où la rallonge explicite.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function extensionOf(key: string): string {
  const match = /\.([a-z0-9]{2,5})$/i.exec(key);
  return match ? `.${match[1]!.toLowerCase()}` : ".jpg";
}

/**
 * Téléchargement groupé des photos payées, en une archive.
 *
 * C'est la promesse de l'écran d'après-paiement : « vos photos sont à
 * vous ». Sans cette route, le client devait appuyer longuement sur chaque
 * photo, une par une, sur un téléphone — la promesse était écrite mais pas
 * tenue.
 *
 * Public et non authentifié comme le reste de /g/[token] : le token non
 * devinable EST le droit d'accès. Mais la commande doit être payée, et on
 * ne sert que les photos réellement achetées — jamais tout le lot.
 */
export async function GET(_request: Request, { params }: { params: { token: string } }): Promise<Response> {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { sortie: true, order: true },
  });

  if (!participant || participant.deletedAt) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  if (participant.order?.status !== "succeeded") {
    return Response.json({ error: "not_paid" }, { status: 402 });
  }

  const purchasedIds = participant.order.photoIds;
  if (purchasedIds.length === 0) {
    return Response.json({ error: "empty" }, { status: 404 });
  }

  const photos = await prisma.photo.findMany({
    where: { id: { in: purchasedIds }, hiddenAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, originalKey: true },
  });
  if (photos.length === 0) {
    return Response.json({ error: "empty" }, { status: 404 });
  }

  const base = slugForFilename(participant.sortie.activity);
  const pad = String(photos.length).length;

  const entries: ZipEntrySource[] = photos.map((photo, i) => ({
    name: `${base}-${String(i + 1).padStart(pad, "0")}${extensionOf(photo.originalKey)}`,
    load: () => downloadOriginal(photo.originalKey),
  }));

  const day = participant.sortie.startsAt.toLocaleDateString("en-CA", { timeZone: "Europe/Paris" });
  const filename = `${base}-${day}.zip`;

  return new Response(zipStream(entries), {
    headers: {
      "Content-Type": "application/zip",
      // Les deux formes : `filename` pour les clients anciens, `filename*`
      // pour que les accents survivent partout ailleurs.
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
