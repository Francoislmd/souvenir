import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireOperatorUser } from "@/lib/current-user";
import { getPreviewUrl } from "@/lib/storage";
import { bucketSortie } from "@/lib/sorties";
import { env } from "@/lib/env";
import { SortieScreen, type ScreenClient } from "@/components/sorties/SortieScreen";

function metaLine(startsAt: Date, bucket: "today" | "upcoming" | "past", guide: string | null, clientCount: number): string {
  const time = startsAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  const day =
    bucket === "today"
      ? "Aujourd'hui"
      : startsAt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase());
  const bits = [`${day} ${time}`];
  if (guide) bits.push(guide);
  if (clientCount > 0) bits.push(`${clientCount} participant${clientCount > 1 ? "s" : ""}`);
  return bits.join(" · ");
}

export default async function SortieDetailPage({ params }: { params: { sortieId: string } }) {
  const dbUser = await requireOperatorUser();

  const sortie = await prisma.sortie.findFirst({
    where: { id: params.sortieId, operatorId: dbUser.operatorId },
    include: {
      participants: { orderBy: { createdAt: "asc" }, include: { order: true } },
      photos: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!sortie) notFound();

  const isGroup = sortie.mode === "GROUPE";
  const clients: ScreenClient[] = sortie.participants.map((p) => ({
    id: p.id,
    name: p.name,
    contact: p.contact,
    sentAt: p.sentAt ? p.sentAt.toISOString() : null,
    token: p.token,
    paid: p.order?.status === "succeeded",
    amountCents: p.order?.status === "succeeded" ? p.order.amountCents : 0,
  }));

  return (
    <SortieScreen
      sortieId={sortie.id}
      title={sortie.place ? `${sortie.activity}, ${sortie.place}` : sortie.activity}
      meta={metaLine(sortie.startsAt, bucketSortie(sortie.startsAt), sortie.guide, sortie.participants.length)}
      isGroup={isGroup}
      published={sortie.status === "SENT"}
      shareUrl={isGroup && dbUser.operator.shareToken ? `${env.NEXT_PUBLIC_APP_URL}/g/s/${dbUser.operator.shareToken}` : null}
      clients={clients}
      initialPhotos={sortie.photos.map((p) => ({
        id: p.id,
        ownerId: p.ownerId,
        thumbUrl: p.thumbKey ? getPreviewUrl(p.thumbKey) : null,
      }))}
    />
  );
}
