import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — invitation à la galerie de groupe. Envoyée à la volée par
 * l'opérateur depuis "Envoyer au groupe" (une liste d'emails saisie à la
 * main, pas des Participant — personne n'est encore identifié en mode
 * GROUPE). Un seul bouton vers le lien partagé, pas de suivi individuel.
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
}: GroupInviteProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Vos photos de {activity} vous attendent.</Preview>
      <Body style={s.body}>
        <Container style={s.card}>
          <Section style={{ padding: "18px 22px", borderBottom: `1px solid ${brand.line}` }}>
            <Row>
              <Column style={{ width: 34, paddingRight: 11 }}>
                {operatorLogoUrl ? (
                  <Img src={operatorLogoUrl} width={34} height={34} alt="" style={{ display: "block", width: 34, height: 34, objectFit: "cover", borderRadius: 10 }} />
                ) : (
                  <table cellPadding={0} cellSpacing={0} border={0} width={34} style={{ backgroundColor: operatorColor, borderRadius: 10 }}>
                    <tbody>
                      <tr>
                        <td height={34} align="center" style={{ color: brand.white, fontFamily: brand.fontHead, fontWeight: 700, fontSize: 12 }}>
                          {operatorInitials}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </Column>
              <Column>
                <Text style={{ ...s.h1, fontSize: "15px", letterSpacing: "-0.2px", margin: 0 }}>{operatorName}</Text>
                <Text style={{ ...s.small, marginTop: 2 }}>
                  Sortie du {sortieDate}
                  {sortiePlace ? ` · ${sortiePlace}` : ""}
                </Text>
              </Column>
            </Row>
          </Section>

          <Section style={{ padding: "22px 22px 0" }}>
            <Text style={s.h1}>Vos photos vous attendent</Text>
            <Text style={s.lead}>
              {activity}
              {sortiePlace ? ` à ${sortiePlace}` : ""}, le {sortieDate}. Retrouvez votre créneau et vos photos avec le lien ci-dessous.
            </Text>
          </Section>

          <Section style={{ padding: 22 }}>
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
            <Text style={{ ...s.small, textAlign: "center", marginTop: 11 }}>
              Aucun compte à créer · lien valable 90 jours
            </Text>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "16px 22px 22px" }}>
            <Text style={s.small}>Envoyé par {operatorName} via Souvenir, à la demande de l&rsquo;opérateur.</Text>
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
  galleryUrl: "https://linktrip.co/g/s/abc123",
} satisfies GroupInviteProps;
