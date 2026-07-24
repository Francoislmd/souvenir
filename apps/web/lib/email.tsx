import type { ReactElement } from "react";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { env } from "./env";
import { prisma } from "./prisma";
import PhotosReady, { type PhotosReadyProps } from "@/emails/PhotosReady";
import PhotosReminder, { type PhotosReminderProps } from "@/emails/PhotosReminder";
import PhotosOffer, { type PhotosOfferProps } from "@/emails/PhotosOffer";
import OrderConfirmed, { type OrderConfirmedProps } from "@/emails/OrderConfirmed";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }
  return resendClient;
}

// Le client reconnaît son école, pas un outil inconnu — Reply-To part vers
// l'opérateur, jamais vers une adresse technique Souvenir.
async function getReplyTo(operatorId: string): Promise<string | undefined> {
  const admin = await prisma.user.findFirst({ where: { operatorId, role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  return admin?.email;
}

// RFC 8058 "one-click" : la cible est une route API qui accepte un simple
// POST sans confirmation — uniquement sur les emails marketing (2, 3, 5),
// jamais sur les transactionnels (1, 4).
function unsubscribeHeaders(token: string): Record<string, string> {
  return {
    "List-Unsubscribe": `<${env.NEXT_PUBLIC_APP_URL}/api/g/${token}/unsubscribe>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

async function dispatch(params: {
  to: string;
  subject: string;
  element: ReactElement;
  replyTo?: string;
  headers?: Record<string, string>;
}): Promise<void> {
  const [html, text] = await Promise.all([render(params.element), render(params.element, { plainText: true })]);

  const { error } = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: params.to,
    subject: params.subject,
    html,
    text,
    ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    ...(params.headers ? { headers: params.headers } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }
}

/** Email 1 · livraison — transactionnel, jamais coupé par une désinscription. */
export async function sendPhotosReadyEmail(params: {
  to: string;
  token: string;
  operatorId: string;
  firstName: string;
  operatorName: string;
  operatorColor: string;
  operatorLogoUrl?: string | null;
  activity: string;
  sortieDate: string;
  sortieTime: string;
  sortiePlace?: string | null;
  photoCount: number;
  heroUrl: string | null;
  thumbUrls: string[];
  galleryUrl: string;
  deleteUrl: string;
  unsubUrl: string;
}): Promise<void> {
  const replyTo = await getReplyTo(params.operatorId);
  const props: PhotosReadyProps = {
    firstName: params.firstName,
    operatorName: params.operatorName,
    operatorInitials: params.operatorName.slice(0, 2).toUpperCase(),
    operatorColor: params.operatorColor,
    operatorLogoUrl: params.operatorLogoUrl ?? undefined,
    activity: params.activity,
    sortieDate: params.sortieDate,
    sortieTime: params.sortieTime,
    sortiePlace: params.sortiePlace ?? undefined,
    photoCount: params.photoCount,
    heroUrl: params.heroUrl,
    thumbUrls: params.thumbUrls,
    galleryUrl: params.galleryUrl,
    deleteUrl: params.deleteUrl,
    unsubUrl: params.unsubUrl,
  };
  await dispatch({
    to: params.to,
    subject: `${params.firstName}, vos photos du ${params.sortieDate}`,
    element: <PhotosReady {...props} />,
    replyTo,
  });
}

/** Email 2 · relance à 2h, galerie non ouverte — marketing. */
export async function sendPhotosReminderEmail(params: {
  to: string;
  token: string;
  operatorId: string;
  firstName: string;
  operatorName: string;
  activity: string;
  sortieDate: string;
  sortieTime: string;
  sortiePlace?: string | null;
  heroUrl: string | null;
  photoCount: number;
  galleryUrl: string;
  unsubUrl: string;
}): Promise<void> {
  const replyTo = await getReplyTo(params.operatorId);
  const props: PhotosReminderProps = {
    operatorName: params.operatorName,
    activity: params.activity,
    sortieDate: params.sortieDate,
    sortieTime: params.sortieTime,
    sortiePlace: params.sortiePlace ?? undefined,
    heroUrl: params.heroUrl,
    photoCount: params.photoCount,
    galleryUrl: params.galleryUrl,
    unsubUrl: params.unsubUrl,
  };
  await dispatch({
    to: params.to,
    subject: `Vos photos vous attendent, ${params.firstName}`,
    element: <PhotosReminder {...props} />,
    replyTo,
    headers: unsubscribeHeaders(params.token),
  });
}

/** Email 3 · offre à 24h, vue sans achat — marketing, part une seule fois. */
export async function sendPhotosOfferEmail(params: {
  to: string;
  token: string;
  operatorId: string;
  operatorName: string;
  activity: string;
  sortieDate: string;
  sortieTime: string;
  sortiePlace?: string | null;
  thumbUrls: string[];
  discountPercent: number;
  pricePromo: string;
  priceFull: string;
  offerDeadlineDay: string; // « jeudi » — pour l'objet
  offerDeadlineLabel: string; // « jeudi 24 juillet, 18 h » — pour le corps
  galleryUrl: string;
  unsubUrl: string;
}): Promise<void> {
  const replyTo = await getReplyTo(params.operatorId);
  const props: PhotosOfferProps = {
    operatorName: params.operatorName,
    activity: params.activity,
    sortieDate: params.sortieDate,
    sortieTime: params.sortieTime,
    sortiePlace: params.sortiePlace ?? undefined,
    thumbUrls: params.thumbUrls,
    discountPercent: params.discountPercent,
    pricePromo: params.pricePromo,
    priceFull: params.priceFull,
    offerDeadlineLabel: params.offerDeadlineLabel,
    galleryUrl: params.galleryUrl,
    unsubUrl: params.unsubUrl,
  };
  await dispatch({
    to: params.to,
    subject: `-${params.discountPercent} % sur vos photos, jusqu'à ${params.offerDeadlineDay}`,
    element: <PhotosOffer {...props} />,
    replyTo,
    headers: unsubscribeHeaders(params.token),
  });
}

/** Email 4 · confirmation d'achat — transactionnel, jamais coupé. */
export async function sendOrderConfirmedEmail(params: {
  to: string;
  operatorId: string;
  operatorName: string;
  photoCount: number;
  downloadUrl: string;
  packLabel: string;
  amountLabel: string;
  orderRef: string;
  orderDateLabel: string;
  reviewUrl: string | null;
  supportUrl: string;
}): Promise<void> {
  const replyTo = await getReplyTo(params.operatorId);
  const props: OrderConfirmedProps = {
    operatorName: params.operatorName,
    photoCount: params.photoCount,
    downloadUrl: params.downloadUrl,
    packLabel: params.packLabel,
    amountLabel: params.amountLabel,
    orderRef: params.orderRef,
    orderDateLabel: params.orderDateLabel,
    reviewUrl: params.reviewUrl,
    supportUrl: params.supportUrl,
  };
  await dispatch({
    to: params.to,
    subject: "Vos photos sont à vous",
    element: <OrderConfirmed {...props} />,
    replyTo,
  });
}
