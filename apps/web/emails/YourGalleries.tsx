import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";
import { Hero, buttonColor } from "./parts";

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
  /** La photo de couverture du prestataire (Réglages), en tête du mail. */
  heroUrl?: string;
  galleries: {
    activity: string;
    date: string;
    /** « départ 10 h » */
    detail?: string;
    photoCount?: number;
    /** Une vignette très floutée de la sortie. */
    thumb?: string;
    url: string;
  }[];
}

export default function YourGalleries({ operatorName, operatorInitials, operatorColor, operatorLogoUrl, heroUrl, galleries }: YourGalleriesProps) {
  const color = buttonColor(operatorColor);
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${galleries.length} galeries privées chez ${operatorName}, une par sortie.`}</Preview>
      <Body style={{ ...s.body, padding: "16px 8px" }}>
        <Container style={s.card}>
          <Hero
            operatorName={operatorName}
            operatorInitials={operatorInitials}
            operatorColor={operatorColor}
            operatorLogoUrl={operatorLogoUrl}
            heroUrl={heroUrl}
            subtitle="Galerie privée officielle"
          />

          <Section style={{ padding: "26px 24px 0" }}>
            <Text style={{ ...s.h1, fontSize: "26px", lineHeight: "1.15", letterSpacing: "-0.6px" }}>Vos {galleries.length} galeries photos</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", lineHeight: "1.6", margin: "10px 0 0" }}>
              Une par sortie. Chaque lien est personnel et n&rsquo;ouvre que les photos de votre départ.
            </Text>
          </Section>

          <Section style={{ padding: "14px 24px 18px" }}>
            {galleries.map((g, i) => (
              <Row key={g.url} style={{ borderTop: i === 0 ? "none" : `1px solid ${brand.line}` }}>
                {g.thumb ? (
                  <Column style={{ width: 64, padding: "14px 14px 14px 0", verticalAlign: "middle" }}>
                    <Link href={g.url}>
                      <Img src={g.thumb} width={64} height={64} alt="" style={{ display: "block", width: 64, height: 64, borderRadius: 12 }} />
                    </Link>
                  </Column>
                ) : null}
                <Column style={{ padding: "14px 0", verticalAlign: "middle" }}>
                  <Text style={{ ...s.h1, fontSize: "16px", margin: 0 }}>{g.activity}</Text>
                  <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", lineHeight: "1.5", marginTop: 2 }}>
                    {[g.date, g.detail].filter(Boolean).join(" · ")}
                    {g.photoCount ? (
                      <>
                        <br />
                        {g.photoCount} photo{g.photoCount > 1 ? "s" : ""}
                      </>
                    ) : null}
                  </Text>
                </Column>
                <Column align="right" style={{ width: 96, padding: "14px 0 14px 12px", verticalAlign: "middle" }}>
                  <table cellPadding={0} cellSpacing={0} border={0} role="presentation">
                    <tbody>
                      <tr>
                        <td align="center" style={{ backgroundColor: color, borderRadius: 11 }}>
                          <Link href={g.url} style={{ ...s.buttonLink, padding: "10px 16px", fontSize: "14px", whiteSpace: "nowrap" }}>
                            Voir
                          </Link>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Column>
              </Row>
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
    { activity: "Canyoning", date: "26 septembre", detail: "départ 10 h", photoCount: 42, url: "https://linktrip.co/g/a" },
    { activity: "Rafting", date: "2 octobre", detail: "départ 14 h", photoCount: 38, url: "https://linktrip.co/g/b" },
  ],
} satisfies YourGalleriesProps;
