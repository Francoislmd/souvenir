import { prisma, Role, SortieStatus, Channel, PhotoStatus } from "../src/index.js";

const DEMO_EMAIL = "francoislemarchand4@gmail.com";

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const DAY = 24 * HOUR;
const now = Date.now();

function deriveChannel(contact: string): Channel {
  return contact.includes("@") ? Channel.EMAIL : Channel.WHATSAPP;
}

interface SeedParticipant {
  name: string;
  contact: string;
  createdAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  photoCount: number;
  freeCount: number;
  order?: { amountCents: number; feeCents: number; stripePi: string; paidAt: Date };
}

interface SeedSortie {
  activity: string;
  place: string;
  startsAt: Date;
  seats: number;
  guide: string;
  status: SortieStatus;
  participants: SeedParticipant[];
  commonPhotoCount: number;
}

async function main(): Promise<void> {
  const operator = await prisma.operator.upsert({
    where: { slug: "vol-passion-annecy" },
    update: {},
    create: {
      name: "Vol Passion Annecy",
      slug: "vol-passion-annecy",
      pricePhotoCents: 800,
      pricePackCents: 2200,
      priceAllCents: 3900,
      packSize: 3,
      freeCount: 2,
      feePercent: 20,
      googleReviewUrl: "https://g.page/r/CXXXXXXXXXXXXXX/review",
    },
  });

  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { operatorId: operator.id, role: Role.ADMIN },
    create: { email: DEMO_EMAIL, role: Role.ADMIN, operatorId: operator.id },
  });

  const sorties: SeedSortie[] = [
    {
      activity: "Parapente biplace",
      place: "Forclaz",
      startsAt: new Date(now + 1 * DAY + 9.5 * HOUR),
      seats: 6,
      guide: "Marc",
      status: SortieStatus.UPCOMING,
      participants: [],
      commonPhotoCount: 0,
    },
    {
      activity: "Canyoning",
      place: "Angon",
      startsAt: new Date(now - 2 * HOUR),
      seats: 8,
      guide: "Sofia",
      status: SortieStatus.SORTED,
      participants: [
        { name: "Léa", contact: "lea.p@email.com", createdAt: new Date(now - 3 * HOUR), photoCount: 4, freeCount: 2 },
        { name: "Yanis", contact: "+33600000012", createdAt: new Date(now - 3 * HOUR), photoCount: 3, freeCount: 2 },
        { name: "Chloé", contact: "chloe.b@email.com", createdAt: new Date(now - 3 * HOUR), photoCount: 4, freeCount: 2 },
      ],
      commonPhotoCount: 3,
    },
    {
      activity: "Via ferrata",
      place: "Cornillon",
      startsAt: new Date(now - 1 * DAY),
      seats: 5,
      guide: "Julien",
      status: SortieStatus.SENT,
      participants: [
        {
          name: "Tom",
          contact: "tom.d@email.com",
          createdAt: new Date(now - 1 * DAY - 1 * HOUR),
          sentAt: new Date(now - 1 * DAY),
          openedAt: new Date(now - 1 * DAY + 10 * MIN),
          photoCount: 5,
          freeCount: 2,
          order: {
            amountCents: 2200,
            feeCents: 440,
            stripePi: "pi_seed_tom",
            paidAt: new Date(now - 1 * DAY + 20 * MIN),
          },
        },
        {
          name: "Camille",
          contact: "+33600000013",
          createdAt: new Date(now - 1 * DAY - 1 * HOUR),
          sentAt: new Date(now - 1 * DAY),
          openedAt: new Date(now - 1 * DAY + 30 * MIN),
          photoCount: 4,
          freeCount: 2,
        },
        {
          name: "Rémi",
          contact: "remi.f@email.com",
          createdAt: new Date(now - 1 * DAY - 1 * HOUR),
          sentAt: new Date(now - 1 * DAY),
          photoCount: 3,
          freeCount: 2,
        },
      ],
      commonPhotoCount: 2,
    },
  ];

  for (const s of sorties) {
    let sortie = await prisma.sortie.findFirst({
      where: { operatorId: operator.id, activity: s.activity, place: s.place },
    });
    if (!sortie) {
      sortie = await prisma.sortie.create({
        data: {
          operatorId: operator.id,
          activity: s.activity,
          place: s.place,
          startsAt: s.startsAt,
          seats: s.seats,
          guide: s.guide,
          status: s.status,
        },
      });
    } else {
      sortie = await prisma.sortie.update({
        where: { id: sortie.id },
        data: { startsAt: s.startsAt, seats: s.seats, guide: s.guide, status: s.status },
      });
    }

    await prisma.photo.deleteMany({ where: { sortieId: sortie.id } });
    await prisma.order.deleteMany({ where: { participant: { sortieId: sortie.id } } });
    await prisma.participant.deleteMany({ where: { sortieId: sortie.id } });

    const participantIds: string[] = [];
    for (const p of s.participants) {
      const participant = await prisma.participant.create({
        data: {
          sortieId: sortie.id,
          name: p.name,
          contact: p.contact,
          channel: deriveChannel(p.contact),
          token: crypto.randomUUID(),
          consentAt: p.createdAt,
          deleteAt: new Date(p.createdAt.getTime() + 90 * DAY),
          sentAt: p.sentAt,
          openedAt: p.openedAt,
          createdAt: p.createdAt,
        },
      });
      participantIds.push(participant.id);

      let photoIndex = 0;
      for (let i = 0; i < p.photoCount; i++, photoIndex++) {
        await prisma.photo.create({
          data: {
            sortieId: sortie.id,
            ownerId: participant.id,
            originalKey: `${sortie.id}/seed-${participant.id}-${photoIndex}.jpg`,
            previewKey: `${sortie.id}/seed-${participant.id}-${photoIndex}-preview.jpg`,
            thumbKey: `${sortie.id}/seed-${participant.id}-${photoIndex}-thumb.jpg`,
            status: PhotoStatus.READY,
            isFreeSample: i < p.freeCount,
          },
        });
      }

      if (p.order) {
        await prisma.order.create({
          data: {
            participantId: participant.id,
            photoIds: [], // seed doesn't need real photoIds for the balance/sales list to render
            amountCents: p.order.amountCents,
            feeCents: p.order.feeCents,
            stripePi: p.order.stripePi,
            status: "succeeded",
            paidAt: p.order.paidAt,
          },
        });
      }
    }

    for (let i = 0; i < s.commonPhotoCount; i++) {
      await prisma.photo.create({
        data: {
          sortieId: sortie.id,
          ownerId: null,
          originalKey: `${sortie.id}/seed-common-${i}.jpg`,
          previewKey: `${sortie.id}/seed-common-${i}-preview.jpg`,
          thumbKey: `${sortie.id}/seed-common-${i}-thumb.jpg`,
          status: PhotoStatus.READY,
        },
      });
    }

    await prisma.event.deleteMany({ where: { operatorId: operator.id, participantId: { in: participantIds } } });
  }

  console.log(`[seed] opérateur "${operator.name}" (${operator.slug}) prêt`);
  console.log(`[seed] connecte-toi avec ${DEMO_EMAIL} pour voir les sorties`);
  console.log(`[seed] ${sorties.length} sorties créées`);
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
