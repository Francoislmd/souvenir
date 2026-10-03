import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Plusieurs galeries pour une même adresse, en un seul mail : la réponse à
 * « Retrouvez vos photos » quand le client a fait plusieurs sorties chez le
 * même prestataire. Une ligne par sortie, chacune avec son lien personnel.
 */
export interface YourGalleriesProps {
  operatorName: string;
  operatorInitials: string;
  operatorColor: string;
  operatorLogoUrl?: string;
  galleries: { activity: string; date: string; detail?: string; url: string }[];
}

export default function YourGalleries({ operatorName, operatorInitials, operatorColor, operatorLogoUrl, galleries }: YourGalleriesProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${galleries.length} galeries privées chez ${operatorName}. Un lien par sortie.`}</Preview>
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
              </Column>
            </Row>
          </Section>

          <Section style={{ padding: "26px 24px 0" }}>
            <Text style={{ ...s.h1, fontSize: "24px", lineHeight: "1.2" }}>Vos {galleries.length} galeries</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", lineHeight: "1.6", margin: "10px 0 0" }}>
              Une par sortie. Chaque lien est personnel et n&rsquo;ouvre que les photos de votre départ.
            </Text>
          </Section>

          <Section style={{ padding: "16px 24px 8px" }}>
            {galleries.map((g, i) => (
              <table key={g.url} width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ borderTop: i === 0 ? "none" : `1px solid ${brand.line}` }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "14px 0", verticalAlign: "middle" }}>
                      <Text style={{ ...s.h1, fontSize: "16px", margin: 0 }}>{g.activity}</Text>
                      <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", marginTop: 2 }}>
                        {g.date}
                        {g.detail ? ` · ${g.detail}` : ""}
                      </Text>
                    </td>
                    <td align="right" style={{ padding: "14px 0 14px 12px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <Link href={g.url} style={{ ...s.buttonLink, display: "inline-block", backgroundColor: brand.ink, borderRadius: 999, padding: "10px 16px", fontSize: "14px" }}>
                        Voir mes photos
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}
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

YourGalleries.PreviewProps = {
  operatorName: "Canyon Aventure",
  operatorInitials: "CA",
  operatorColor: "#0FBEB6",
  galleries: [
    { activity: "Canyoning", date: "26 septembre", detail: "départ 10 h", url: "https://linktrip.co/g/a" },
    { activity: "Rafting", date: "2 octobre", detail: "départ 14 h", url: "https://linktrip.co/g/b" },
  ],
} satisfies YourGalleriesProps;
