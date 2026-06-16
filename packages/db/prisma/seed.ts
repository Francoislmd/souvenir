import { prisma, Mode, Role, DeliveryStatus, MediaKind, MediaStatus } from "../src/index.js";

const DEMO_EMAIL = "francoislemarchand4@gmail.com";
const DEMO_SESSION_LABEL = "Rotation démo (seed)";

const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const now = Date.now();

interface SeedMedia {
  kind: MediaKind;
  sizeBytes: number;
  durationSec?: number;
}

interface SeedDelivery {
  code: string;
  clientName: string;
  status: DeliveryStatus;
  createdAt: Date;
  claimedAt?: Date;
  clientPhone?: string;
  consentImage?: boolean;
  media: SeedMedia[];
  events: { name: string; createdAt: Date }[];
  order?: { stripePaymentId: string };
}

async function main(): Promise<void> {
  const operator = await prisma.operator.upsert({
    where: { slug: "vol-passion-annecy" },
    update: {},
    create: {
      name: "Vol Passion Annecy",
      slug: "vol-passion-annecy",
      packPriceCents: 2900,
      feePercent: 20,
      defaultMode: Mode.BOUTIQUE,
      googleReviewUrl: "https://g.page/r/CXXXXXXXXXXXXXX/review",
      instagramHandle: "volpassionannecy",
    },
  });

  await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { operatorId: operator.id, role: Role.ADMIN },
    create: { email: DEMO_EMAIL, role: Role.ADMIN, operatorId: operator.id },
  });

  let session = await prisma.session.findFirst({
    where: { operatorId: operator.id, label: DEMO_SESSION_LABEL },
  });
  if (!session) {
    session = await prisma.session.create({
      data: { operatorId: operator.id, label: DEMO_SESSION_LABEL, mode: Mode.BOUTIQUE },
    });
  }

  const deliveries: SeedDelivery[] = [
    {
      code: "AB11MN",
      clientName: "Sacha",
      status: DeliveryStatus.CREATED,
      createdAt: new Date(now - 10 * MIN),
      media: [],
      events: [{ name: "delivery_created", createdAt: new Date(now - 10 * MIN) }],
    },
    {
      code: "AB12CD",
      clientName: "Léa",
      status: DeliveryStatus.CREATED,
      createdAt: new Date(now - 30 * MIN),
      media: [],
      events: [{ name: "delivery_created", createdAt: new Date(now - 30 * MIN) }],
    },
    {
      code: "AB34EF",
      clientName: "Marc",
      status: DeliveryStatus.CLAIMED,
      createdAt: new Date(now - 3 * HOUR),
      claimedAt: new Date(now - 3 * HOUR + 5 * MIN),
      clientPhone: "+33600000002",
      consentImage: true,
      media: [
        { kind: MediaKind.PHOTO, sizeBytes: 3_200_000 },
        { kind: MediaKind.PHOTO, sizeBytes: 2_900_000 },
      ],
      events: [
        { name: "delivery_created", createdAt: new Date(now - 3 * HOUR) },
        { name: "media_uploaded", createdAt: new Date(now - 3 * HOUR + 1 * MIN) },
        { name: "media_uploaded", createdAt: new Date(now - 3 * HOUR + 1 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 3 * HOUR + 2 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 3 * HOUR + 2 * MIN) },
        { name: "wa_message_received", createdAt: new Date(now - 3 * HOUR + 5 * MIN) },
        { name: "gallery_opened", createdAt: new Date(now - 3 * HOUR + 6 * MIN) },
      ],
    },
    {
      code: "AB56GH",
      clientName: "Inès",
      status: DeliveryStatus.CLAIMED,
      createdAt: new Date(now - 2 * HOUR),
      claimedAt: new Date(now - 2 * HOUR + 10 * MIN),
      clientPhone: "+33600000003",
      consentImage: true,
      media: [
        { kind: MediaKind.PHOTO, sizeBytes: 3_100_000 },
        { kind: MediaKind.VIDEO, sizeBytes: 84_000_000, durationSec: 95 },
      ],
      events: [
        { name: "delivery_created", createdAt: new Date(now - 2 * HOUR) },
        { name: "media_uploaded", createdAt: new Date(now - 2 * HOUR + 1 * MIN) },
        { name: "media_uploaded", createdAt: new Date(now - 2 * HOUR + 1 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 2 * HOUR + 4 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 2 * HOUR + 4 * MIN) },
        { name: "wa_message_received", createdAt: new Date(now - 2 * HOUR + 10 * MIN) },
        { name: "gallery_opened", createdAt: new Date(now - 2 * HOUR + 11 * MIN) },
        { name: "checkout_started", createdAt: new Date(now - 2 * HOUR + 13 * MIN) },
      ],
    },
    {
      code: "AB78IJ",
      clientName: "Tom",
      status: DeliveryStatus.PURCHASED,
      createdAt: new Date(now - 5 * HOUR),
      claimedAt: new Date(now - 5 * HOUR + 10 * MIN),
      clientPhone: "+33600000004",
      consentImage: true,
      media: [
        { kind: MediaKind.PHOTO, sizeBytes: 3_400_000 },
        { kind: MediaKind.PHOTO, sizeBytes: 3_000_000 },
        { kind: MediaKind.VIDEO, sizeBytes: 120_000_000, durationSec: 130 },
      ],
      events: [
        { name: "delivery_created", createdAt: new Date(now - 5 * HOUR) },
        { name: "media_uploaded", createdAt: new Date(now - 5 * HOUR + 1 * MIN) },
        { name: "media_uploaded", createdAt: new Date(now - 5 * HOUR + 1 * MIN) },
        { name: "media_uploaded", createdAt: new Date(now - 5 * HOUR + 1 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 5 * HOUR + 5 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 5 * HOUR + 5 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 5 * HOUR + 5 * MIN) },
        { name: "wa_message_received", createdAt: new Date(now - 5 * HOUR + 10 * MIN) },
        { name: "gallery_opened", createdAt: new Date(now - 5 * HOUR + 11 * MIN) },
        { name: "checkout_started", createdAt: new Date(now - 5 * HOUR + 15 * MIN) },
        { name: "purchase_succeeded", createdAt: new Date(now - 5 * HOUR + 17 * MIN) },
        { name: "zip_downloaded", createdAt: new Date(now - 5 * HOUR + 20 * MIN) },
      ],
      order: { stripePaymentId: "pi_seed_AB78IJ" },
    },
    {
      code: "AB90KL",
      clientName: "Camille",
      status: DeliveryStatus.PURCHASED,
      createdAt: new Date(now - 4 * HOUR),
      claimedAt: new Date(now - 4 * HOUR + 8 * MIN),
      clientPhone: "+33600000005",
      consentImage: true,
      media: [
        { kind: MediaKind.PHOTO, sizeBytes: 2_800_000 },
        { kind: MediaKind.VIDEO, sizeBytes: 95_000_000, durationSec: 110 },
      ],
      events: [
        { name: "delivery_created", createdAt: new Date(now - 4 * HOUR) },
        { name: "media_uploaded", createdAt: new Date(now - 4 * HOUR + 1 * MIN) },
        { name: "media_uploaded", createdAt: new Date(now - 4 * HOUR + 1 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 4 * HOUR + 4 * MIN) },
        { name: "media_ready", createdAt: new Date(now - 4 * HOUR + 4 * MIN) },
        { name: "wa_message_received", createdAt: new Date(now - 4 * HOUR + 8 * MIN) },
        { name: "gallery_opened", createdAt: new Date(now - 4 * HOUR + 9 * MIN) },
        { name: "checkout_started", createdAt: new Date(now - 4 * HOUR + 12 * MIN) },
        { name: "purchase_succeeded", createdAt: new Date(now - 4 * HOUR + 14 * MIN) },
      ],
      order: { stripePaymentId: "pi_seed_AB90KL" },
    },
  ];

  for (const d of deliveries) {
    const delivery = await prisma.delivery.upsert({
      where: { code: d.code },
      update: {
        sessionId: session.id,
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        status: d.status,
        claimedAt: d.claimedAt,
        consentImage: d.consentImage ?? false,
        createdAt: d.createdAt,
      },
      create: {
        sessionId: session.id,
        code: d.code,
        token: crypto.randomUUID(),
        clientName: d.clientName,
        clientPhone: d.clientPhone,
        status: d.status,
        claimedAt: d.claimedAt,
        consentImage: d.consentImage ?? false,
        createdAt: d.createdAt,
      },
    });

    await prisma.media.deleteMany({ where: { deliveryId: delivery.id } });
    for (const [i, m] of d.media.entries()) {
      const ext = m.kind === MediaKind.PHOTO ? "jpg" : "mp4";
      await prisma.media.create({
        data: {
          deliveryId: delivery.id,
          kind: m.kind,
          originalKey: `${delivery.id}/seed-${i}.${ext}`,
          previewKey: `${delivery.id}/seed-${i}-preview.${ext}`,
          thumbKey: `${delivery.id}/seed-${i}-thumb.jpg`,
          status: MediaStatus.READY,
          sizeBytes: m.sizeBytes,
          durationSec: m.durationSec,
        },
      });
    }

    await prisma.event.deleteMany({ where: { deliveryId: delivery.id } });
    await prisma.event.createMany({
      data: d.events.map((e) => ({
        operatorId: operator.id,
        deliveryId: delivery.id,
        name: e.name,
        createdAt: e.createdAt,
      })),
    });

    if (d.order) {
      await prisma.order.upsert({
        where: { deliveryId: delivery.id },
        update: {},
        create: {
          deliveryId: delivery.id,
          amountCents: operator.packPriceCents,
          feeCents: Math.round((operator.packPriceCents * operator.feePercent) / 100),
          stripePaymentId: d.order.stripePaymentId,
          status: "succeeded",
        },
      });
    }
  }

  console.log(`[seed] opérateur "${operator.name}" (${operator.slug}) prêt`);
  console.log(`[seed] connecte-toi avec ${DEMO_EMAIL} pour voir le dashboard`);
  console.log(`[seed] ${deliveries.length} deliveries dans "${session.label}"`);
}

main()
  .catch((error) => {
    console.error("[seed] failed", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
