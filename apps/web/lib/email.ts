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
const BRAND_TINT = "#EEF2FF";
const HERO_BG = "linear-gradient(160deg, #0F172A 0%, #1E3070 45%, #2563EB 100%)";

const MONTHS_FR = [
  "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
  "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
];

function formatDateFr(d: Date): string {
  return `${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}

function lockSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
}

function diamondSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${BRAND}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.7 10.3a2.41 2.41 0 0 0 0 3.41l7.59 7.59a2.41 2.41 0 0 0 3.41 0l7.59-7.59a2.41 2.41 0 0 0 0-3.41l-7.59-7.59a2.41 2.41 0 0 0-3.41 0Z"/></svg>`;
}

function previewTile(thumbUrl: string | null, isLocked: boolean, plusCount?: number): string {
  if (plusCount !== undefined) {
    return `
      <td width="24%" style="padding:0 2px;">
        <div style="height:90px; background:#1E293B; border-radius:10px; text-align:center; vertical-align:middle; display:table; width:100%;">
          <div style="display:table-cell; vertical-align:middle; text-align:center;">
            <span style="font-size:22px; font-weight:800; color:#FFFFFF; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">+${plusCount}</span>
          </div>
        </div>
      </td>`;
  }

  if (thumbUrl) {
    const src = escapeHtml(thumbUrl);
    return `
      <td width="24%" style="padding:0 2px;">
        <div style="position:relative; height:90px; border-radius:10px; overflow:hidden;">
          <img src="${src}" alt="" width="100%" height="90" style="display:block; width:100%; height:90px; object-fit:cover; border-radius:10px; opacity:0.80; filter:blur(3px) grayscale(10%);" />
          ${isLocked ? `<div style="position:absolute; top:0; left:0; width:100%; height:100%; display:table; background:rgba(15,23,42,0.15); border-radius:10px;"><div style="display:table-cell; vertical-align:middle; text-align:center;">${lockSvg()}</div></div>` : ""}
        </div>
      </td>`;
  }

  return `
    <td width="24%" style="padding:0 2px;">
      <div style="height:90px; background:${BRAND_TINT}; border-radius:10px; text-align:center; vertical-align:middle; display:table; width:100%;">
        ${isLocked ? `<div style="display:table-cell; vertical-align:middle; text-align:center;">${lockSvg().replace('rgba(255,255,255,0.92)', BRAND)}</div>` : ""}
      </div>
    </td>`;
}

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
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const safeOperatorName = escapeHtml(operatorName);
  const safeGalleryUrl = escapeHtml(galleryUrl);
  const initials = operatorName.slice(0, 2).toUpperCase();
  const firstName = clientName ? escapeHtml(clientName.trim().split(/\s+/)[0] ?? "") : null;

  const heroTitle = firstName ? `Quel vol, ${firstName}.` : "Quel vol !";

  const metaParts: string[] = ["BIPLACE"];
  if (location) metaParts.push(escapeHtml(location.toUpperCase()));
  if (sessionDate) metaParts.push(formatDateFr(sessionDate));
  const metaLine = metaParts.join(" · ");

  const totalCount = photoCount + videoCount;
  const countParts: string[] = [];
  if (photoCount > 0) countParts.push(`${photoCount} photo${photoCount > 1 ? "s" : ""}`);
  if (videoCount > 0) countParts.push(`${videoCount} vidéo${videoCount > 1 ? "s" : ""}`);
  const countBadge = countParts.join(" · ");

  const descParts: string[] = [];
  if (photoCount > 0) descParts.push(`<strong>${photoCount} photo${photoCount > 1 ? "s" : ""}</strong>`);
  if (videoCount > 0) descParts.push(`<strong>${videoCount === 1 ? "vidéo" : videoCount + " vidéos"}</strong>`);
  const mediaDesc =
    descParts.length > 0
      ? `Tes ${descParts.join(" et ")} ${totalCount > 1 ? "t'attendent" : "t'attend"}. On t'en offre l'aperçu&nbsp;— la version HD, sans filigrane, est à un geste.`
      : safeMessage;

  const priceEur = Math.floor(packPriceCents / 100);
  const priceCts = packPriceCents % 100;
  const priceStr = priceCts > 0 ? `${priceEur},${priceCts.toString().padStart(2, "0")} €` : `${priceEur} €`;

  const packMediaStr = [
    photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? "s" : ""}` : null,
    videoCount > 0 ? `${videoCount} vidéo${videoCount > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(" & ");

  const isLocked = mode === "BOUTIQUE";
  const displayedThumbs = thumbUrls.slice(0, 3);
  const extraCount = totalCount > 3 ? totalCount - 3 : 0;

  // Build 4 preview tile cells
  let tilesHtml = "";
  for (let i = 0; i < 3; i++) {
    tilesHtml += previewTile(displayedThumbs[i] ?? null, isLocked);
  }
  if (extraCount > 0) {
    tilesHtml += previewTile(null, false, extraCount);
  } else {
    tilesHtml += previewTile(thumbUrls[3] ?? null, isLocked);
  }

  const packCard =
    mode === "BOUTIQUE"
      ? `
        <!-- Pack card -->
        <tr>
          <td style="padding:20px 28px 0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F7FF; border:1.5px solid #C7D2FE; border-radius:16px;">
              <tr>
                <td style="padding:20px 20px 0 20px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="vertical-align:top;">
                        <p style="margin:0 0 6px 0; font-size:15px; font-weight:700; color:#0F172A; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Pack HD complet</p>
                        <p style="margin:0; font-size:13px; color:#64748B; line-height:1.6; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${packMediaStr ? `${packMediaStr} · ` : ""}qualité d'origine<br/>· sans filigrane · téléchargement zip</p>
                      </td>
                      <td style="vertical-align:top; text-align:right; white-space:nowrap; padding-left:12px;">
                        <p style="margin:0; font-size:34px; font-weight:800; color:#0F172A; line-height:1; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${priceStr}</p>
                        <p style="margin:4px 0 0 0; font-size:11px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">paiement unique</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px 8px 20px;">
                  <a href="${safeGalleryUrl}" style="display:block; background:${BRAND}; color:#ffffff; text-decoration:none; font-weight:800; font-size:16px; padding:17px 24px; border-radius:12px; text-align:center; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
                    Débloquer mes souvenirs
                  </a>
                </td>
              </tr>
              <tr>
                <td style="padding:0 20px 16px 20px; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Paiement sécurisé · Stripe</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
      : `
        <!-- Marketing CTA -->
        <tr>
          <td style="padding:20px 28px 0 28px; text-align:center;">
            <a href="${safeGalleryUrl}" style="display:block; background:${BRAND}; color:#ffffff; text-decoration:none; font-weight:800; font-size:16px; padding:17px 24px; border-radius:12px; text-align:center; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
              Voir mes souvenirs
            </a>
          </td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0; padding:0; background-color:#EEF2FF; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:560px; margin:0 auto; padding:24px 16px 48px;">

      <!-- Header: operator + via Souvenir -->
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="vertical-align:middle;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle; padding-right:10px;">
                  ${
                    logoUrl
                      ? `<img src="${escapeHtml(logoUrl)}" alt="${safeOperatorName}" width="34" height="34" style="border-radius:8px; object-fit:cover; display:block;" />`
                      : `<div style="width:34px; height:34px; line-height:34px; border-radius:8px; background:${BRAND}; color:#fff; font-weight:800; font-size:13px; text-align:center;">${initials}</div>`
                  }
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:15px; font-weight:700; color:#0F172A;">${safeOperatorName}</span>
                </td>
              </tr>
            </table>
          </td>
          <td style="text-align:right; vertical-align:middle;">
            <table cellpadding="0" cellspacing="0" style="display:inline-table; margin-left:auto;">
              <tr>
                <td style="vertical-align:middle; padding-right:5px;">
                  <div style="width:8px; height:8px; border-radius:2px; background:${BRAND};"></div>
                </td>
                <td style="vertical-align:middle;">
                  <span style="font-size:12px; color:#64748B;">via Souvenir</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Main card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 4px 32px rgba(15,23,42,0.10);">

        <!-- Hero: sky gradient -->
        <tr>
          <td style="background:${HERO_BG}; padding:32px 28px 24px; position:relative;">
            <p style="margin:0 0 14px 0; font-size:11px; font-weight:700; letter-spacing:0.12em; color:rgba(255,255,255,0.55); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${metaLine}</p>
            <h1 style="margin:0; font-size:38px; font-weight:800; color:#FFFFFF; line-height:1.1; letter-spacing:-0.02em; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${heroTitle}</h1>
            ${
              countBadge
                ? `<p style="margin:16px 0 0; font-size:13px; font-weight:600; color:rgba(255,255,255,0.65); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif; text-align:right;">${countBadge}</p>`
                : ""
            }
          </td>
        </tr>

        <!-- Subtitle -->
        <tr>
          <td style="padding:28px 28px 0 28px;">
            <p style="margin:0 0 4px 0; font-size:11px; font-weight:700; letter-spacing:0.1em; color:${BRAND}; text-transform:uppercase; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Tes souvenirs sont prêts</p>
            <h2 style="margin:0 0 12px 0; font-size:28px; font-weight:800; color:#0F172A; letter-spacing:-0.02em; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Revis ton vol.</h2>
            <p style="margin:0; font-size:15px; line-height:1.65; color:#475569; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${mediaDesc}</p>
          </td>
        </tr>

        <!-- Preview grid -->
        <tr>
          <td style="padding:20px 28px 0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>${tilesHtml}</tr>
            </table>
          </td>
        </tr>

        ${packCard}

        <!-- Benefits -->
        <tr>
          <td style="padding:24px 28px 0 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E2E8F0;">
              <tr>
                <td width="33%" style="padding:20px 4px 0 0; text-align:center; vertical-align:top;">
                  <div style="margin-bottom:6px;">${diamondSvg()}</div>
                  <p style="margin:0; font-size:12px; font-weight:700; color:#0F172A; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Sans filigrane</p>
                  <p style="margin:2px 0 0; font-size:11px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">qualité HD</p>
                </td>
                <td width="34%" style="padding:20px 4px 0; text-align:center; vertical-align:top; border-left:1px solid #E2E8F0; border-right:1px solid #E2E8F0;">
                  <div style="margin-bottom:6px;">${diamondSvg()}</div>
                  <p style="margin:0; font-size:12px; font-weight:700; color:#0F172A; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Qualité d'origine</p>
                  <p style="margin:2px 0 0; font-size:11px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">photos &amp; vidéos</p>
                </td>
                <td width="33%" style="padding:20px 0 0 4px; text-align:center; vertical-align:top;">
                  <div style="margin-bottom:6px;">${diamondSvg()}</div>
                  <p style="margin:0; font-size:12px; font-weight:700; color:#0F172A; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">À toi, pour toujours</p>
                  <p style="margin:2px 0 0; font-size:11px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">lien permanent</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:20px 28px 32px 28px; text-align:center;">
            <p style="margin:0; font-size:12px; line-height:1.6; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Garde précieusement ce lien, il te permet de retrouver tes souvenirs quand tu veux.</p>
          </td>
        </tr>

      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px 4px 0; text-align:center; font-size:12px; color:#94A3B8; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Envoyé par ${safeOperatorName} · via Souvenir
          </td>
        </tr>
      </table>

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
