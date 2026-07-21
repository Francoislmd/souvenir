import { prisma } from "./client";

export type EventName =
  | "delivery_created"
  | "media_uploaded"
  | "media_ready"
  | "qr_displayed"
  | "wa_message_received"
  | "gallery_opened"
  | "preview_played"
  | "checkout_started"
  | "purchase_succeeded"
  | "zip_downloaded"
  | "review_link_clicked"
  | "email_captured"
  | "ig_share_clicked"
  | "review_window_missed"
  | "delivery_sent"
  | "onboarding_qualified";

interface TrackParams {
  operatorId: string;
  deliveryId?: string;
  meta?: Record<string, unknown>;
}

export async function track(name: EventName, { operatorId, deliveryId, meta }: TrackParams): Promise<void> {
  await prisma.event.create({
    data: {
      name,
      operatorId,
      deliveryId,
      meta: meta as never,
    },
  });
}
