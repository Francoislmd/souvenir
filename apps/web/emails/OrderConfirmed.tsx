import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — email 4 · CONFIRMATION D'ACHAT (transactionnel — pas de
 * désinscription possible, jamais coupé).
 *
 * L'avis Google se demande ici, pas avant : ce sont les acheteurs les plus
 * satisfaits, donc les meilleures notes (voir §5 du brief).
 */

export interface OrderConfirmedProps {
  operatorName: string;
  photoCount: number;
  downloadUrl: string;
  packLabel: string; // « Pack 3 photos + 2 offertes »
  amountLabel: string; // « 22,00 € » — déjà formaté
  orderRef: string; // « SV-4821 »
  orderDateLabel: string; // « 22 juillet »
  reviewUrl: string | null; // null si l'opérateur n'a pas configuré de lien d'avis
  supportUrl: string;
}

export default function OrderConfirmed({
  operatorName,
  photoCount,
  downloadUrl,
  packLabel,
  amountLabel,
  orderRef,
  orderDateLabel,
  reviewUrl,
  supportUrl,
}: OrderConfirmedProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`Téléchargement + reçu · commande ${orderRef}`}</Preview>
      <Body style={s.body}>
        <Container style={s.card}>

          <Section style={{ padding: "28px 22px 0", textAlign: "center" }}>
            <table cellPadding={0} cellSpacing={0} border={0} width={52} style={{ backgroundColor: brand.okSoft, borderRadius: 26, margin: "0 auto" }}>
              <tbody>
                <tr>
                  <td height={52} align="center" style={{ fontSize: 24, color: brand.ok, fontFamily: "Arial, sans-serif" }}>
                    &#10003;
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={{ ...s.h1, textAlign: "center", marginTop: 15 }}>Elles sont à vous</Text>
            <Text style={{ ...s.lead, textAlign: "center" }}>
              {photoCount} photo{photoCount > 1 ? "s" : ""} en pleine résolution, sans filigrane.
            </Text>
          </Section>

          <Section style={{ padding: "22px 22px 0" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td align="center" style={s.buttonCell(brand.ink)}>
                    <Link href={downloadUrl} style={s.buttonLink}>Télécharger mes photos</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* reçu */}
          <Section style={{ padding: "20px 22px 0" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ backgroundColor: brand.line2, borderRadius: 14 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "15px 16px", fontFamily: brand.fontBody, fontSize: 13, color: brand.ink2 }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                      <tbody>
                        <tr>
                          <td style={{ paddingBottom: 7 }}>{packLabel}</td>
                          <td align="right" style={{ fontFamily: brand.fontHead, fontWeight: 700, color: brand.ink }}>{amountLabel}</td>
                        </tr>
                        <tr>
                          <td style={{ color: brand.ink4, fontSize: 12 }}>Commande #{orderRef} · {orderDateLabel}</td>
                          <td align="right" style={{ color: brand.ink4, fontSize: 12 }}>Payé</td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* demande d'avis — acheteurs uniquement */}
          {reviewUrl && (
            <Section style={{ padding: "20px 22px 0" }}>
              <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ border: `1px solid ${brand.line}`, borderRadius: 16 }}>
                <tbody>
                  <tr>
                    <td align="center" style={{ padding: "20px 18px" }}>
                      <Text style={{ margin: 0, color: "#FFB443", fontSize: 19, letterSpacing: "3px" }}>&#9733;&#9733;&#9733;&#9733;&#9733;</Text>
                      <Text style={{ ...s.h1, fontSize: 16, marginTop: 9 }}>Vous avez aimé votre sortie ?</Text>
                      <Text style={{ ...s.lead, fontSize: 13, marginTop: 6 }}>
                        Un avis Google prend 30 secondes et aide énormément une petite structure comme {operatorName}.
                      </Text>
                      <table cellPadding={0} cellSpacing={0} border={0} style={{ margin: "14px auto 0" }}>
                        <tbody>
                          <tr>
                            <td align="center" style={{ backgroundColor: brand.orange, borderRadius: 999 }}>
                              <Link href={reviewUrl} style={{ ...s.buttonLink, padding: "12px 22px", fontSize: 14 }}>
                                Laisser un avis
                              </Link>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          )}

          <Hr style={{ borderColor: brand.line, margin: "20px 0 0" }} />
          <Section style={{ padding: "16px 22px 22px" }}>
            <Text style={s.small}>
              Votre lien de téléchargement reste actif 90 jours.
              <br />
              {operatorName} via Souvenir ·{" "}
              <Link href={supportUrl} style={{ color: brand.ink3 }}>une question ?</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

OrderConfirmed.PreviewProps = {
  operatorName: "Annecy Vol Libre",
  photoCount: 5,
  downloadUrl: "https://linktrip.co/g/julie-4k2p",
  packLabel: "Pack 3 photos + 2 offertes",
  amountLabel: "22,00 €",
  orderRef: "SV-4821",
  orderDateLabel: "22 juillet",
  reviewUrl: "https://g.page/r/example/review",
  supportUrl: "https://linktrip.co/g/julie-4k2p",
} satisfies OrderConfirmedProps;
