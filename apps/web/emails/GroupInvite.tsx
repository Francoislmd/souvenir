import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Invitation à la boutique d'une sortie GROUPE. Envoyée par l'opérateur
 * depuis « Envoyez le lien à vos clients » (adresses saisies à la main).
 *
 * Les photos passent avant le texte : ce sont les aperçus filigranés déjà
 * publics sur la boutique (groupPreviewKey), jamais les originaux. Sans
 * aperçu prêt (sortie ancienne), l'email reste complet sans bloc image.
 */

export interface GroupInviteProps {
  operatorName: string;
  operatorInitials: string;
  operatorColor: string;
  operatorLogoUrl?: string;
  activity: string;
  sortieDate: string;
  sortiePlace?: string;
  galleryUrl: string;
  /** Aperçus filigranés, dans l'ordre : le premier en grand, les trois suivants en rangée. */
  previewUrls?: string[];
  /** Photos et vidéos visibles dans la boutique. */
  mediaCount?: number;
  /** « 20 décembre » : dernier jour en ligne. */
  purgeDate?: string;
}

const pad = 24;
const inner = brand.width - pad * 2; // 512

// Le gris clair des autres emails (ink4) passe mal sur mobile : 2,5:1 sur blanc.
const note = { ...s.small, color: brand.ink3, fontSize: "13px", lineHeight: "1.6" };

export default function GroupInvite({
  operatorName,
  operatorInitials,
  operatorColor,
  operatorLogoUrl,
  activity,
  sortieDate,
  sortiePlace,
  galleryUrl,
  previewUrls = [],
  mediaCount,
  purgeDate,
}: GroupInviteProps) {
  const [hero, ...rest] = previewUrls;
  const strip = rest.slice(0, 3);
  const countLabel = mediaCount && mediaCount > 1 ? `${mediaCount} photos` : null;

  return (
    <Html lang="fr">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>
        {`${activity}, ${sortieDate}. ${countLabel ? `${countLabel} en ligne. ` : ""}Choisissez l’heure de votre sortie pour retrouver les vôtres.`}
      </Preview>
      <Body style={{ ...s.body, padding: "16px 8px" }}>
        <Container style={s.card}>
          {/* — l'école, en une ligne — */}
          <Section style={{ padding: `20px ${pad}px` }}>
            <Row>
              <Column style={{ width: 40, paddingRight: 12, verticalAlign: "middle" }}>
                {operatorLogoUrl ? (
                  <Img
                    src={operatorLogoUrl}
                    width={40}
                    height={40}
                    alt={operatorName}
                    style={{ display: "block", width: 40, height: 40, objectFit: "contain", borderRadius: 10, border: `1px solid ${brand.line}` }}
                  />
                ) : (
                  <table cellPadding={0} cellSpacing={0} border={0} width={40} style={{ backgroundColor: operatorColor, borderRadius: 10 }}>
                    <tbody>
                      <tr>
                        <td height={40} align="center" style={{ color: brand.white, fontFamily: brand.fontHead, fontWeight: 700, fontSize: 14 }}>
                          {operatorInitials}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </Column>
              <Column style={{ verticalAlign: "middle" }}>
                <Text style={{ ...s.h1, fontSize: "16px", letterSpacing: "-0.2px", margin: 0 }}>{operatorName}</Text>
                <Text style={{ ...note, fontSize: "13px", margin: "1px 0 0" }}>
                  {activity}
                  {sortiePlace ? ` · ${sortiePlace}` : ""}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* — les photos de la sortie — */}
          {hero && (
            <Section style={{ padding: `0 ${pad}px` }}>
              <Link href={galleryUrl}>
                <Img
                  src={hero}
                  width={inner}
                  height={270}
                  alt={`Photos de la sortie du ${sortieDate}`}
                  style={{ display: "block", width: "100%", maxWidth: inner, height: 270, objectFit: "cover", borderRadius: 14 }}
                />
              </Link>
              {strip.length === 3 && (
                <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ marginTop: 6 }}>
                  <tbody>
                    <tr>
                      {strip.map((url, i) => (
                        <td key={url} width="33.33%" style={{ paddingLeft: i === 0 ? 0 : 3, paddingRight: i === 2 ? 0 : 3 }}>
                          <Link href={galleryUrl}>
                            <Img
                              src={url}
                              width={167}
                              height={104}
                              alt=""
                              style={{ display: "block", width: "100%", height: 104, objectFit: "cover", borderRadius: 10 }}
                            />
                          </Link>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </Section>
          )}

          {/* — le message — */}
          <Section style={{ padding: `${hero ? 26 : 4}px ${pad}px 0` }}>
            <Text style={{ ...s.h1, fontSize: "24px", lineHeight: "1.2" }}>Vos photos du {sortieDate} sont en ligne</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", margin: "10px 0 0" }}>
              {countLabel ? `${countLabel} de la journée. ` : ""}Choisissez l&rsquo;heure de votre sortie pour retrouver les vôtres.
            </Text>
          </Section>

          {/* — un seul bouton — */}
          <Section style={{ padding: `24px ${pad}px ${pad}px` }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td align="center" style={s.buttonCell(brand.ink)}>
                    <Link href={galleryUrl} style={s.buttonLink}>
                      Voir mes photos
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={{ ...note, textAlign: "center", marginTop: 12 }}>
              Aucun compte à créer. {purgeDate ? `En ligne jusqu’au ${purgeDate}.` : "En ligne pendant 90 jours."}
            </Text>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: `18px ${pad}px 22px` }}>
            <Text style={note}>Une question&nbsp;? Répondez à ce mail, il arrive directement chez {operatorName}.</Text>
            <Text style={{ ...note, color: brand.ink4, fontSize: "12px", marginTop: 6 }}>Envoyé par {operatorName} via Linktrip.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

GroupInvite.PreviewProps = {
  operatorName: "Nauticà Adventures",
  operatorInitials: "NA",
  operatorColor: "#0FBEB6",
  activity: "Jet-ski",
  sortieDate: "21 septembre",
  sortiePlace: "Cavalaire-sur-Mer",
  galleryUrl: "https://store.linktrip.co/nautica-adventures/k7m2pq",
  mediaCount: 38,
  purgeDate: "20 décembre",
} satisfies GroupInviteProps;
