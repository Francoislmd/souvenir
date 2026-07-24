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

const HERO_BG = "linear-gradient(120deg, #FF3D6E, #FF5A1F 52%, #FFB443)";
const FF = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

const LOCK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

function thumbTile(src: string | null): string {
  const img = src
    ? `<img src="${escapeHtml(src)}" alt="" width="100%" height="100" style="display:block;width:100%;height:100px;object-fit:cover;filter:blur(4px);" />`
    : `<div style="height:100px;background:linear-gradient(135deg,#FFD9A8,#FF8A5B);"></div>`;
  return `<td width="25%" style="padding:0;line-height:0;font-size:0;">
    <div style="position:relative;overflow:hidden;height:100px;">${img}
      <div style="position:absolute;inset:0;display:table;width:100%;background:rgba(22,19,32,.18);"><div style="display:table-cell;vertical-align:middle;text-align:center;">${LOCK_SVG}</div></div>
    </div>
  </td>`;
}

export function renderGalleryEmailHtml({
  operatorName,
  logoUrl,
  activity,
  place,
  clientName,
  photoCount,
  thumbUrls = [],
  galleryUrl,
}: {
  operatorName: string;
  logoUrl: string | null;
  activity: string;
  place?: string | null;
  clientName: string;
  photoCount: number;
  thumbUrls?: string[];
  galleryUrl: string;
}): string {
  const safeOperatorName = escapeHtml(operatorName);
  const safeGalleryUrl = escapeHtml(galleryUrl);
  const initials = operatorName.slice(0, 2).toUpperCase();
  const firstName = escapeHtml(clientName.trim().split(/\s+/)[0] ?? "");

  const metaParts = [escapeHtml(activity.toUpperCase())];
  if (place) metaParts.push(escapeHtml(place.toUpperCase()));
  const metaLine = metaParts.join(" &nbsp;·&nbsp; ");

  const tiles = Array.from({ length: 4 }, (_, i) => thumbTile(thumbUrls[i] ?? null)).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vos photos sont prêtes</title>
</head>
<body style="margin:0;padding:0;background:#F1F0EC;-webkit-font-smoothing:antialiased;">
<div style="max-width:560px;margin:0 auto;padding:28px 16px 48px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:0 4px 18px;vertical-align:middle;">
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="vertical-align:middle;padding-right:10px;">
            ${
              logoUrl
                ? `<img src="${escapeHtml(logoUrl)}" alt="${safeOperatorName}" width="32" height="32" style="display:block;border-radius:8px;object-fit:cover;" />`
                : `<div style="width:32px;height:32px;line-height:32px;border-radius:8px;background:#FF5A1F;color:#fff;font-weight:800;font-size:13px;text-align:center;font-family:${FF};">${initials}</div>`
            }
          </td>
          <td style="vertical-align:middle;">
            <span style="font-size:14px;font-weight:700;color:#161320;font-family:${FF};">${safeOperatorName}</span>
          </td>
        </tr></table>
      </td>
      <td style="text-align:right;vertical-align:middle;padding-bottom:18px;">
        <span style="font-size:12px;color:#A6A0B2;font-family:${FF};">via Linktrip</span>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 2px 20px rgba(22,19,32,0.08);">
    <tr>
      <td style="background:${HERO_BG};padding:40px 28px 32px;">
        <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.14em;color:rgba(255,255,255,0.75);text-transform:uppercase;font-family:${FF};">${metaLine}</p>
        <h1 style="margin:0;font-size:34px;font-weight:800;color:#FFFFFF;line-height:1.14;letter-spacing:-0.022em;font-family:${FF};">${firstName}, vos photos sont là</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:0;line-height:0;font-size:0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>${tiles}</tr></table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 28px 0;">
        <p style="margin:0;font-size:16px;line-height:1.6;color:#413C4E;font-family:${FF};"><strong>${photoCount} photo${photoCount > 1 ? "s" : ""}</strong> vous attend${photoCount > 1 ? "ent" : ""}. Découvrez-les, gardez vos préférées.</p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 28px 36px;">
        <a href="${safeGalleryUrl}" style="display:block;background:#161320;color:#FFFFFF;text-decoration:none;font-weight:800;font-size:16px;letter-spacing:-0.01em;padding:16px 24px;border-radius:999px;text-align:center;font-family:${FF};">Voir mes photos</a>
      </td>
    </tr>
  </table>

  <p style="margin:20px 0 0;text-align:center;font-size:12px;color:#A6A0B2;font-family:${FF};">
    Envoyé par ${safeOperatorName} &nbsp;·&nbsp; via Linktrip
  </p>
</div>
</body>
</html>`;
}

export async function sendGalleryEmail(params: {
  to: string;
  operatorName: string;
  logoUrl: string | null;
  activity: string;
  place?: string | null;
  clientName: string;
  photoCount: number;
  thumbUrls?: string[];
  galleryUrl: string;
}): Promise<void> {
  const html = renderGalleryEmailHtml(params);
  const firstName = params.clientName.trim().split(/\s+/)[0];
  const subject = `${firstName}, vos photos avec ${params.operatorName} sont là 📸`;

  const { error } = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: params.to,
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function sendReviewRequestEmail(params: {
  to: string;
  operatorName: string;
  reviewUrl: string;
  clientName: string;
}): Promise<void> {
  const firstName = params.clientName.trim().split(/\s+/)[0] ?? "";
  const html = `<!DOCTYPE html><html lang="fr"><body style="margin:0;padding:32px 16px;background:#F1F0EC;font-family:${FF};">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:20px;padding:32px 28px;text-align:center;">
      <p style="margin:0 0 6px;font-size:20px;color:#FFB443;">★★★★★</p>
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#161320;">Vous avez aimé votre sortie ?</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#413C4E;">Un avis Google prend 30 secondes et aide énormément ${escapeHtml(params.operatorName)}.</p>
      <a href="${escapeHtml(params.reviewUrl)}" style="display:inline-block;background:#FF5A1F;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">Laisser un avis</a>
    </div>
  </body></html>`;

  const { error } = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: params.to,
    subject: `${firstName}, un dernier mot pour ${params.operatorName} ?`,
    html,
  });
  if (error) throw new Error(error.message);
}
