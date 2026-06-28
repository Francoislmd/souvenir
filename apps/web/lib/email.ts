import { Resend } from "resend";
import { env } from "./env";

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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const BRAND = "#4F46E5";
const HERO_BG = "linear-gradient(160deg, #0B1120 0%, #1B2A6B 40%, #2D5FBE 75%, #3B82F6 100%)";

const MONTHS_FR = [
  "JANVIER","FÉVRIER","MARS","AVRIL","MAI","JUIN",
  "JUILLET","AOÛT","SEPTEMBRE","OCTOBRE","NOVEMBRE","DÉCEMBRE",
];

function formatDateFr(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

const LOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

// Lock overlay (position:relative on wrapping div — works in Gmail/Apple Mail; degrades gracefully in Outlook)
function thumbTile(src: string | null, locked: boolean): string {
  const img = src
    ? `<img src="${escapeHtml(src)}" alt="" width="100%" height="110" class="preview-img" style="display:block; width:100%; height:110px; object-fit:cover; opacity:0.78; filter:blur(4px) grayscale(12%) scale(1.04);" />`
    : `<div style="height:110px; background:linear-gradient(135deg,#C7D2FE 0%,#818CF8 100%);"></div>`;

  const overlay = locked
    ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; display:table; background:rgba(15,23,42,0.12);"><div style="display:table-cell; vertical-align:middle; text-align:center;">${LOCK_SVG}</div></div>`
    : "";

  return `<td width="25%" style="padding:0; line-height:0; font-size:0;">
    <div class="preview-tile" style="position:relative; overflow:hidden; height:110px;">${img}${overlay}</div>
  </td>`;
}

function plusTile(count: number): string {
  return `<td width="25%" style="padding:0; line-height:0; font-size:0;">
    <div class="preview-tile" style="height:110px; background:#0F172A; display:table; width:100%;">
      <div style="display:table-cell; vertical-align:middle; text-align:center;">
        <span style="font-size:22px; font-weight:800; color:#FFFFFF; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+${count}</span>
      </div>
    </div>
  </td>`;
}

const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

export function renderDeliveryEmailHtml({
  operatorName,
  logoUrl,
  message,
  galleryUrl,
  clientName,
  sessionDate,
  location,
  photoCount = 0,
  videoCount = 0,
  packPriceCents = 2900,
  mode = "BOUTIQUE",
  thumbUrls = [],
}: {
  operatorName: string;
  logoUrl: string | null;
  message: string;
  galleryUrl: string;
  clientName?: string;
  sessionDate?: Date;
  location?: string;
  photoCount?: number;
  videoCount?: number;
  packPriceCents?: number;
  mode?: "BOUTIQUE" | "MARKETING";
  thumbUrls?: string[];
}): string {
  const safeOperatorName = escapeHtml(operatorName);
  const safeGalleryUrl = escapeHtml(galleryUrl);
  const initials = operatorName.slice(0, 2).toUpperCase();
  const firstName = clientName ? escapeHtml(clientName.trim().split(/\s+/)[0] ?? "") : null;

  // Hero content
  const heroTitle = firstName ? `Quel vol, ${firstName}.` : "Quel vol !";
  const metaParts: string[] = ["BIPLACE"];
  if (location) metaParts.push(escapeHtml(location.toUpperCase()));
  if (sessionDate) metaParts.push(formatDateFr(sessionDate));
  const metaLine = metaParts.join(" &nbsp;·&nbsp; ");

  // Description
  const totalCount = photoCount + videoCount;
  const descParts: string[] = [];
  if (photoCount > 0) descParts.push(`<strong>${photoCount} photo${photoCount > 1 ? "s" : ""}</strong>`);
  if (videoCount > 0) descParts.push(`<strong>${videoCount === 1 ? "vidéo" : videoCount + " vidéos"}</strong>`);
  const desc =
    descParts.length > 0
      ? `Tes ${descParts.join(" et ")} ${totalCount > 1 ? "t'attendent" : "t'attend"}. On t'en offre l'aperçu — la version HD, sans filigrane, est à un geste.`
      : escapeHtml(message).replace(/\n/g, "<br />");

  // Price
  const priceEur = Math.floor(packPriceCents / 100);
  const priceCts = packPriceCents % 100;
  const priceStr = priceCts > 0 ? `${priceEur},${priceCts.toString().padStart(2, "0")} €` : `${priceEur} €`;

  // Preview tiles: show first 3 thumbs + "+N" or 4th thumb
  const isLocked = mode === "BOUTIQUE";
  const extra = totalCount > 3 ? totalCount - 3 : 0;
  let tilesHtml = "";
  for (let i = 0; i < 3; i++) tilesHtml += thumbTile(thumbUrls[i] ?? null, isLocked);
  tilesHtml += extra > 0 ? plusTile(extra) : thumbTile(thumbUrls[3] ?? null, isLocked);

  // CTA section
  const ctaHtml =
    mode === "BOUTIQUE"
      ? `<p class="email-price" style="margin:0; font-size:46px; font-weight:800; color:#0F172A; letter-spacing:-0.03em; line-height:1; font-family:${FF};">${priceStr}</p>
         <p style="margin:4px 0 20px; font-size:12px; color:#94A3B8; font-family:${FF};">paiement unique · sans abonnement</p>
         <a href="${safeGalleryUrl}" style="display:block; background:${BRAND}; color:#FFFFFF; text-decoration:none; font-weight:700; font-size:17px; letter-spacing:-0.01em; padding:18px 24px; border-radius:14px; text-align:center; font-family:${FF};">Débloquer mes souvenirs</a>
         <p style="margin:12px 0 0; text-align:center; font-size:12px; color:#94A3B8; font-family:${FF};">🔒&nbsp; Paiement sécurisé via Stripe</p>`
      : `<p style="margin:0 0 6px; font-size:15px; color:#475569; font-family:${FF};">Tout est débloqué pour toi, c'est offert.</p>
         <a href="${safeGalleryUrl}" style="display:block; background:${BRAND}; color:#FFFFFF; text-decoration:none; font-weight:700; font-size:17px; letter-spacing:-0.01em; padding:18px 24px; border-radius:14px; text-align:center; font-family:${FF};">Voir mes souvenirs</a>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tes souvenirs sont prêts</title>
  <style>
    @media screen and (max-width:600px){
      .email-wrapper{padding:0 !important;}
      .email-card{border-radius:0 !important;}
      .email-hero{padding:36px 20px 30px !important;}
      .email-hero-title{font-size:32px !important;}
      .preview-tile{height:96px !important;}
      .preview-img{height:96px !important;}
      .email-content{padding:24px 20px 0 !important;}
      .email-cta{padding:20px 20px 36px !important;}
      .email-price{font-size:38px !important;}
      .email-header{padding:20px 20px 14px !important;}
      .email-footer{padding:16px 20px 0 !important;}
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;-webkit-font-smoothing:antialiased;">
<div class="email-wrapper" style="max-width:560px;margin:0 auto;padding:28px 16px 48px;">

  <!-- HEADER -->
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td class="email-header" style="padding:0 4px 18px;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:middle;padding-right:10px;">
              ${logoUrl
                ? `<img src="${escapeHtml(logoUrl)}" alt="${safeOperatorName}" width="32" height="32" style="display:block;border-radius:8px;object-fit:cover;" />`
                : `<div style="width:32px;height:32px;line-height:32px;border-radius:8px;background:${BRAND};color:#fff;font-weight:800;font-size:13px;text-align:center;font-family:${FF};">${initials}</div>`
              }
            </td>
            <td style="vertical-align:middle;">
              <span style="font-size:14px;font-weight:700;color:#0F172A;font-family:${FF};">${safeOperatorName}</span>
            </td>
          </tr>
        </table>
      </td>
      <td style="text-align:right;vertical-align:middle;padding-bottom:18px;">
        <span style="font-size:12px;color:#94A3B8;font-family:${FF};">via Souvenir</span>
      </td>
    </tr>
  </table>

  <!-- CARD -->
  <table class="email-card" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(15,23,42,0.08);">

    <!-- HERO -->
    <tr>
      <td class="email-hero" style="background:${HERO_BG};padding:44px 28px 36px;">
        <p style="margin:0 0 14px;font-size:11px;font-weight:600;letter-spacing:0.14em;color:rgba(255,255,255,0.45);text-transform:uppercase;font-family:${FF};">${metaLine}</p>
        <h1 class="email-hero-title" style="margin:0;font-size:40px;font-weight:800;color:#FFFFFF;line-height:1.1;letter-spacing:-0.025em;font-family:${FF};">${heroTitle}</h1>
      </td>
    </tr>

    <!-- PREVIEW STRIP (edge-to-edge) -->
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>${tilesHtml}</tr>
        </table>
      </td>
    </tr>

    <!-- DESCRIPTION -->
    <tr>
      <td class="email-content" style="padding:28px 28px 0;">
        <p style="margin:0;font-size:16px;line-height:1.65;color:#334155;font-family:${FF};">${desc}</p>
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td class="email-cta" style="padding:24px 28px 40px;">
        ${ctaHtml}
      </td>
    </tr>

  </table>

  <!-- FOOTER -->
  <p class="email-footer" style="margin:20px 0 0;text-align:center;font-size:12px;color:#94A3B8;font-family:${FF};">
    Envoyé par ${safeOperatorName} &nbsp;·&nbsp; via Souvenir
  </p>

</div>
</body>
</html>`;
}

export async function sendDeliveryEmail({
  to,
  operatorName,
  logoUrl,
  message,
  galleryUrl,
  clientName,
  sessionDate,
  location,
  photoCount,
  videoCount,
  packPriceCents,
  mode,
  thumbUrls,
}: {
  to: string;
  operatorName: string;
  logoUrl: string | null;
  message: string;
  galleryUrl: string;
  clientName?: string;
  sessionDate?: Date;
  location?: string;
  photoCount?: number;
  videoCount?: number;
  packPriceCents?: number;
  mode?: "BOUTIQUE" | "MARKETING";
  thumbUrls?: string[];
}): Promise<void> {
  const html = renderDeliveryEmailHtml({
    operatorName,
    logoUrl,
    message,
    galleryUrl,
    clientName,
    sessionDate,
    location,
    photoCount,
    videoCount,
    packPriceCents,
    mode,
    thumbUrls,
  });

  const firstName = clientName?.trim().split(/\s+/)[0];
  const subject = firstName
    ? `${firstName}, tes souvenirs avec ${operatorName} sont prêts 📸`
    : `Tes souvenirs avec ${operatorName} sont prêts 📸`;

  const { error } = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
