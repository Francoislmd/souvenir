import { Body, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — email 3 · OFFRE À 24H (catégorie marketing, la plus rentable).
 *
 * Envoyé une seule fois si la galerie a été ouverte mais rien n'a été acheté
 * 24h après. L'échéance annoncée doit être réelle — le tarif revient
 * effectivement après expiration (voir reducedOfferExpiresAt côté serveur).
 * Ne jamais envoyer à quelqu'un qui a déjà acheté.
 */

export interface PhotosOfferProps {
  operatorName: string;
  sortieDate: string;
  thumbUrls: string[]; // 2 aperçus, non floutés (ce sont ceux déjà vus par le client)
  discountPercent: number; // 20
  pricePromo: string; // « 16 € » — déjà formaté
  priceFull: string; // « 22 € » — déjà formaté
  offerDeadlineLabel: string; // « jeudi 24 juillet, 18 h »
  galleryUrl: string;
  unsubUrl: string;
}

export default function PhotosOffer({
  operatorName,
  sortieDate,
  thumbUrls,
  discountPercent,
  pricePromo,
  priceFull,
  offerDeadlineLabel,
  galleryUrl,
  unsubUrl,
}: PhotosOfferProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`Le pack photos à ${pricePromo} au lieu de ${priceFull}.`}</Preview>
      <Body style={s.body}>
        <Container style={s.card}>

          <Section style={{ padding: "18px 22px 0" }}>
            <Text style={s.small}>
              {operatorName} · Sortie du {sortieDate}
            </Text>
          </Section>

          {thumbUrls.length > 0 && (
            <Section style={{ padding: "14px 22px 0" }}>
              <Row>
                {thumbUrls.slice(0, 2).map((url, i) => (
                  <Column key={url} style={{ width: "50%", padding: i === 0 ? "0 5px 0 0" : "0 0 0 5px" }}>
                    <Link href={galleryUrl}>
                      <Img src={url} width={253} alt="" style={{ display: "block", width: "100%", borderRadius: 12 }} />
                    </Link>
                  </Column>
                ))}
              </Row>
            </Section>
          )}

          <Section style={{ padding: "20px 22px 0" }}>
            <Text style={{ ...s.h1, fontSize: "19px", letterSpacing: "-0.4px" }}>
              Vous les avez regardées — les voici moins chères
            </Text>
            <Text style={s.lead}>
              Pendant 48 h, votre pack passe à{" "}
              <span style={{ color: brand.ink, fontWeight: 700 }}>{pricePromo}</span>{" "}
              <span style={{ color: brand.ink4, textDecoration: "line-through" }}>{priceFull}</span>
              {" "}(−{discountPercent} %).
            </Text>
          </Section>

          <Section style={{ padding: "18px 22px 0" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: brand.soft, borderRadius: 14 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "14px 16px", fontFamily: brand.fontBody, fontSize: 13, color: brand.orangeInk, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>Offre valable jusqu&rsquo;au {offerDeadlineLabel}.</span>
                    <br />
                    Ensuite le tarif habituel revient.
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={{ padding: "18px 22px 24px" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td align="center" style={s.buttonCell(brand.orange)}>
                    <Link href={`${galleryUrl}?offer=48h`} style={s.buttonLink}>
                      Récupérer mes photos à {pricePromo}
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "16px 22px 20px" }}>
            <Text style={s.small}>
              {operatorName} via Souvenir ·{" "}
              <Link href={unsubUrl} style={{ color: brand.ink3 }}>ne plus recevoir ces messages</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

PhotosOffer.PreviewProps = {
  operatorName: "Annecy Vol Libre",
  sortieDate: "22 juillet",
  thumbUrls: [
    "https://placehold.co/506x464/7FC5EE/FFF.jpg",
    "https://placehold.co/506x464/C9BCF2/FFF.jpg",
  ],
  discountPercent: 20,
  pricePromo: "18 €",
  priceFull: "22 €",
  offerDeadlineLabel: "jeudi 24 juillet, 18 h",
  galleryUrl: "https://linktrip.co/g/julie-4k2p",
  unsubUrl: "https://linktrip.co/g/julie-4k2p/desinscription",
} satisfies PhotosOfferProps;
