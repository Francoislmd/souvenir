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
      <Preview>{`${activity}, le ${sortieDate}. Choisissez l’heure de votre sortie pour retrouver vos photos.`}</Preview>
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

          <Section style={{ padding: "26px 24px 0" }}>
            <Text style={{ ...s.h1, fontSize: "24px", lineHeight: "1.2" }}>Vos photos vous attendent</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", lineHeight: "1.6", margin: "10px 0 0" }}>
              Choisissez l&rsquo;heure de votre sortie pour retrouver vos photos.
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
              Aucun compte à créer · lien valable 90 jours
            </Text>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "18px 24px 22px" }}>
            <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", lineHeight: "1.6" }}>
              Une question&nbsp;? Répondez à ce mail, il arrive directement chez {operatorName}.
            </Text>
            <Text style={{ ...s.small, marginTop: 6 }}>Envoyé par {operatorName} via Linktrip.</Text>
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
