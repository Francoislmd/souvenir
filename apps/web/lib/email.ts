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

const BRAND_GRADIENT = "linear-gradient(135deg, #FFC857 0%, #FF6F3C 55%, #F0386B 100%)";
const BRAND_PINK = "#F0386B";

export function renderDeliveryEmailHtml({
  operatorName,
  logoUrl,
  message,
  galleryUrl,
}: {
  operatorName: string;
  logoUrl: string | null;
  message: string;
  galleryUrl: string;
}): string {
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />");
  const safeOperatorName = escapeHtml(operatorName);
  const safeGalleryUrl = escapeHtml(galleryUrl);
  const initials = safeOperatorName.slice(0, 2).toUpperCase();

  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0; padding:0; background-color:#FAF7F4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
    <div style="max-width:520px; margin:0 auto; padding:32px 16px;">

      <!-- Bandeau de marque -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 4px 20px 4px; text-align:center;">
            <span style="font-size:13px; font-weight:800; letter-spacing:0.08em; color:#F0386B; text-transform:uppercase;">Souvenir</span>
            <span style="font-size:13px; color:#C9BDB3;"> &middot; </span>
            <span style="font-size:13px; font-weight:600; color:#6E6259;">${safeOperatorName}</span>
          </td>
        </tr>
      </table>

      <!-- Carte principale -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF; border-radius:24px; overflow:hidden; box-shadow:0 4px 28px rgba(31,27,23,0.10);">

        <!-- Hero -->
        <tr>
          <td style="background:${BRAND_GRADIENT}; padding:44px 32px; text-align:center;">
            ${
              logoUrl
                ? `<img src="${escapeHtml(logoUrl)}" alt="${safeOperatorName}" width="48" height="48" style="border-radius:12px; object-fit:cover; display:block; margin:0 auto 16px auto; box-shadow:0 4px 14px rgba(0,0,0,0.18);" />`
                : `<div style="display:inline-block; width:48px; height:48px; line-height:48px; margin-bottom:16px; border-radius:12px; background:rgba(255,255,255,0.22); color:#fff; font-weight:800; font-size:18px; text-align:center; box-shadow:0 4px 14px rgba(0,0,0,0.18);">${initials}</div>`
            }
            <h1 style="margin:0; font-size:30px; line-height:1.25; font-weight:800; letter-spacing:-0.01em; color:#FFFFFF;">Tes souvenirs sont prêts !</h1>
          </td>
        </tr>

        <!-- Aperçu galerie -->
        <tr>
          <td style="padding:28px 32px 0 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="33%" style="padding-right:4px;">
                  <div style="height:72px; line-height:72px; text-align:center; font-size:26px; border-radius:12px; background:#FFEEE3;">📷</div>
                </td>
                <td width="34%" style="padding:0 4px;">
                  <div style="height:72px; line-height:72px; text-align:center; font-size:26px; border-radius:12px; background:#FBE2E8;">🎬</div>
                </td>
                <td width="33%" style="padding-left:4px;">
                  <div style="height:72px; line-height:72px; text-align:center; font-size:26px; border-radius:12px; background:#FFF6E9;">✨</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Message -->
        <tr>
          <td style="padding:24px 32px 0 32px; text-align:center;">
            <p style="margin:0; font-size:15px; line-height:1.65; color:#6E6259;">${safeMessage}</p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:28px 32px 0 32px; text-align:center;">
            <a href="${safeGalleryUrl}" style="display:block; background:${BRAND_PINK}; color:#ffffff; text-decoration:none; font-weight:800; font-size:16px; padding:18px 24px; border-radius:14px;">
              Voir mes photos et vidéos
            </a>
          </td>
        </tr>

        <!-- Bénéfices -->
        <tr>
          <td style="padding:28px 32px 0 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #ECE4DC;">
              <tr>
                <td style="padding:20px 4px 0 0; width:33%; text-align:center; vertical-align:top;">
                  <p style="margin:0; font-size:12px; font-weight:700; color:#1F1B17;">Haute définition</p>
                  <p style="margin:2px 0 0 0; font-size:11px; color:#A89C90;">photos &amp; vidéos</p>
                </td>
                <td style="padding:20px 4px 0 4px; width:34%; text-align:center; vertical-align:top; border-left:1px solid #ECE4DC; border-right:1px solid #ECE4DC;">
                  <p style="margin:0; font-size:12px; font-weight:700; color:#1F1B17;">Tout en zip</p>
                  <p style="margin:2px 0 0 0; font-size:11px; color:#A89C90;">en un clic</p>
                </td>
                <td style="padding:20px 0 0 4px; width:33%; text-align:center; vertical-align:top;">
                  <p style="margin:0; font-size:12px; font-weight:700; color:#1F1B17;">Lien permanent</p>
                  <p style="margin:2px 0 0 0; font-size:11px; color:#A89C90;">à tout moment</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Note -->
        <tr>
          <td style="padding:24px 32px 32px 32px; text-align:center;">
            <p style="margin:0; font-size:12px; line-height:1.6; color:#A89C90;">Garde précieusement ce lien, il te permet de retrouver tes souvenirs quand tu veux.</p>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:20px 4px 0 4px; text-align:center; font-size:12px; color:#A89C90;">
            Envoyé par ${safeOperatorName} &middot; via Souvenir
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
}: {
  to: string;
  operatorName: string;
  logoUrl: string | null;
  message: string;
  galleryUrl: string;
}): Promise<void> {
  const html = renderDeliveryEmailHtml({ operatorName, logoUrl, message, galleryUrl });

  const { error } = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject: `Tes souvenirs avec ${operatorName} sont prêts 📸`,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}
