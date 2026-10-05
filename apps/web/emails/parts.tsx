import { Column, Img, Link, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";
import { buttonColor as readableButton } from "../lib/color";

/**
 * Les pièces communes aux mails de galerie privée (invitation, relances,
 * galeries regroupées). Inspiré du mail de Finisher Memories : la photo du
 * prestataire en tête, le nom par-dessus, puis un seul geste.
 */

/** La couleur du prestataire pour le bouton, sauf si elle est trop claire pour du texte blanc. */
export function buttonColor(hex: string): string {
  return readableButton(hex, brand.ink);
}

/**
 * La tête du mail : la photo de couverture du prestataire (Réglages),
 * assombrie, avec son logo et son nom. Sans couverture, sa couleur.
 * La photo est en fond de cellule : Gmail et Apple Mail l'affichent,
 * Outlook garde la couleur de fond, le texte reste lisible partout.
 */
export function Hero({
  operatorName,
  operatorInitials,
  operatorColor,
  operatorLogoUrl,
  heroUrl,
  subtitle,
}: {
  operatorName: string;
  operatorInitials: string;
  operatorColor: string;
  operatorLogoUrl?: string;
  heroUrl?: string;
  subtitle: string;
}) {
  const bg = heroUrl ? "#2a2830" : buttonColor(operatorColor);
  return (
    <table
      width="100%"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      role="presentation"
      style={{
        backgroundColor: bg,
        backgroundImage: heroUrl ? `url(${heroUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center 40%",
      }}
    >
      <tbody>
        <tr>
          <td style={{ backgroundColor: heroUrl ? "rgba(10,8,14,0.38)" : "transparent", padding: heroUrl ? "124px 24px 22px" : "26px 24px 22px" }}>
            <table cellPadding={0} cellSpacing={0} border={0} role="presentation">
              <tbody>
                <tr>
                  <td style={{ width: 44, paddingRight: 12, verticalAlign: "middle" }}>
                    {operatorLogoUrl ? (
                      <Img src={operatorLogoUrl} width={44} height={44} alt="" style={{ display: "block", width: 44, height: 44, objectFit: "contain", borderRadius: 12, backgroundColor: brand.white }} />
                    ) : (
                      <table cellPadding={0} cellSpacing={0} border={0} width={44} role="presentation" style={{ backgroundColor: brand.white, borderRadius: 12 }}>
                        <tbody>
                          <tr>
                            <td height={44} align="center" style={{ color: buttonColor(operatorColor), fontFamily: brand.fontHead, fontWeight: 700, fontSize: 15 }}>
                              {operatorInitials}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </td>
                  <td style={{ verticalAlign: "middle" }}>
                    <Text style={{ ...s.h1, color: brand.white, fontSize: "18px", letterSpacing: "-0.3px", margin: 0 }}>{operatorName}</Text>
                    <Text style={{ fontFamily: brand.fontBody, color: brand.white, opacity: 0.88, fontSize: "13px", lineHeight: "1.5", margin: "2px 0 0" }}>{subtitle}</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Quatre vignettes très floutées (Photo.blurEmailKey) et le nombre de
 * photos : on devine sa sortie, on ne reconnaît personne.
 */
export function Thumbs({ urls, count, href }: { urls: string[]; count: number; href: string }) {
  if (urls.length === 0) return null;
  const shown = urls.slice(0, 4);
  return (
    <Section style={{ padding: "20px 24px 0" }}>
      <Link href={href}>
        <Row>
          {shown.map((url, i) => (
            <Column key={url} style={{ width: "25%", paddingLeft: i === 0 ? 0 : 4, paddingRight: i === shown.length - 1 ? 0 : 4 }}>
              <Img src={url} width={118} height={118} alt="" style={{ display: "block", width: "100%", height: "auto", borderRadius: 12 }} />
            </Column>
          ))}
        </Row>
      </Link>
      <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", marginTop: 10 }}>
        <b style={{ color: brand.ink }}>
          {count} photo{count > 1 ? "s" : ""}
        </b>{" "}
        de votre départ, en pleine résolution après l&rsquo;achat.
      </Text>
    </Section>
  );
}

/** Le bouton principal, pleine largeur, à la couleur du prestataire. */
export function Cta({ href, label, color }: { href: string; label: string; color: string }) {
  return (
    <table width="100%" cellPadding={0} cellSpacing={0} border={0} role="presentation">
      <tbody>
        <tr>
          <td align="center" style={{ backgroundColor: buttonColor(color), borderRadius: 14 }}>
            <Link href={href} style={s.buttonLink}>
              {label}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
