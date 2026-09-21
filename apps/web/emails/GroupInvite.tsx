import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Invitation à la boutique d'une sortie GROUPE, et ses deux relances.
 *
 * - "invite"   : envoyée par l'opérateur depuis la carte d'envoi.
 * - "reminder" : 1re relance, J+2, à ceux qui n'ont pas payé (lib/automations.ts).
 * - "last"     : 2e et dernière relance, J+6.
 *
 * Même gabarit pour les trois : seuls le titre, la phrase et le pied changent.
 * Les relances portent un lien de désinscription, l'invitation non.
 */

export type GroupEmailVariant = "invite" | "reminder" | "last";

const COPY: Record<GroupEmailVariant, { title: string; lead: string }> = {
  invite: { title: "Vos photos vous attendent", lead: "Choisissez l\u2019heure de votre sortie pour retrouver vos photos." },
  reminder: { title: "Vos photos sont toujours là", lead: "Choisissez l\u2019heure de votre sortie pour les retrouver." },
  last: { title: "Dernier rappel", lead: "Choisissez l\u2019heure de votre sortie pour retrouver vos photos." },
};

export interface GroupInviteProps {
  operatorName: string;
  operatorInitials: string;
  operatorColor: string;
  operatorLogoUrl?: string;
  activity: string;
  sortieDate: string;
  sortiePlace?: string;
  galleryUrl: string;
  /** Bandeau très flouté tiré d'une photo de la sortie (lib/email-cover.ts). */
  coverUrl?: string;
  variant?: GroupEmailVariant;
  /** « 20 décembre » : dernier jour en ligne (Sortie.purgeAt), affiché sur la dernière relance seulement. */
  purgeDate?: string;
  /** Relances uniquement : page de désinscription. */
  unsubUrl?: string;
}

export default function GroupInvite({
  operatorName,
  operatorInitials,
  operatorColor,
  operatorLogoUrl,
  activity,
  sortieDate,
  sortiePlace,
  galleryUrl,
  coverUrl,
  variant = "invite",
  purgeDate,
  unsubUrl,
}: GroupInviteProps) {
  const copy = COPY[variant];
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${activity}, le ${sortieDate}. ${copy.lead}`}</Preview>
      <Body style={{ ...s.body, padding: "16px 8px" }}>
        <Container style={s.card}>
          <Section style={{ padding: "20px 24px", borderBottom: `1px solid ${brand.line}` }}>
            <Row>
              <Column style={{ width: 40, paddingRight: 12, verticalAlign: "middle" }}>
                {operatorLogoUrl ? (
                  <Img src={operatorLogoUrl} width={40} height={40} alt="" style={{ display: "block", width: 40, height: 40, objectFit: "contain", borderRadius: 10, border: `1px solid ${brand.line}` }} />
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
                <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", marginTop: 1 }}>
                  {activity} · {sortieDate}
                  {sortiePlace ? ` · ${sortiePlace}` : ""}
                </Text>
              </Column>
            </Row>
          </Section>

          {coverUrl && (
            <Section style={{ padding: "20px 24px 0" }}>
              <Link href={galleryUrl}>
                <Img
                  src={coverUrl}
                  width={512}
                  height={170}
                  alt=""
                  style={{ display: "block", width: "100%", maxWidth: 512, height: "auto", borderRadius: 14 }}
                />
              </Link>
            </Section>
          )}

          <Section style={{ padding: `${coverUrl ? 22 : 26}px 24px 0` }}>
            <Text style={{ ...s.h1, fontSize: "24px", lineHeight: "1.2" }}>{copy.title}</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", lineHeight: "1.6", margin: "10px 0 0" }}>
              {copy.lead}
            </Text>
          </Section>

          <Section style={{ padding: "24px 24px 26px" }}>
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
            <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", textAlign: "center", marginTop: 12 }}>
              Aucun compte à créer{variant === "last" && purgeDate ? ` · en ligne jusqu\u2019au ${purgeDate}` : ""}
            </Text>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "18px 24px 22px" }}>
            <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", lineHeight: "1.6" }}>
              Une question&nbsp;? Répondez à ce mail, il arrive directement chez {operatorName}.
            </Text>
            <Text style={{ ...s.small, marginTop: 6 }}>
              Envoyé par {operatorName} via Linktrip
              {unsubUrl ? (
                <>
                  {" · "}
                  <Link href={unsubUrl} style={{ color: brand.ink3 }}>
                    ne plus recevoir de rappel
                  </Link>
                </>
              ) : null}
              .
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

GroupInvite.PreviewProps = {
  operatorName: "Canyon Aventure",
  operatorInitials: "CA",
  operatorColor: "#0FBEB6",
  activity: "Canyoning",
  sortieDate: "22 juillet",
  sortiePlace: "Angon",
  galleryUrl: "https://store.linktrip.co/ecole-de-surf-hossegor/k7m2pq",
} satisfies GroupInviteProps;
