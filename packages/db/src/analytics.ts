import { prisma } from "./client";

export type EventName =
  | "sortie_created"
  | "participant_created"
  | "photos_uploaded"
  | "photo_ready"
  | "photos_assigned"
  | "gallery_sent"
  | "gallery_opened"
  | "checkout_started"
  | "purchase_succeeded"
  | "order_confirmed_sent"
  | "review_link_clicked"
  | "automation_resend_sent"
  | "automation_offer_sent"
  | "automation_review_sent"
  | "gdpr_deletion"
  | "onboarding_qualified";

interface TrackParams {
  operatorId: string;
  participantId?: string;
  meta?: Record<string, unknown>;
}

export async function track(name: EventName, { operatorId, participantId, meta }: TrackParams): Promise<void> {
  await prisma.event.create({
    data: {
      name,
      operatorId,
      participantId,
      meta: meta as never,
    },
  });
}
