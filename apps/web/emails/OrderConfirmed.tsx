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
  orderLabel: string; // « Rafting, samedi 26 septembre · 4 photos »
  amountLabel: string; // « 29,00 € » — déjà formaté
  orderRef: string; // « SV-8K2QF »
  orderDateLabel: string; // « 29/09/2026 »
  cardLabel: string | null; // « Visa •••• 4242 » ; null si Stripe ne l'a pas rendu
  sellerLine: string; // identité du vendeur en une ligne (lib/seller-format.ts)
  cgvUrl: string;
  cgvDateLabel: string; // « 29 septembre 2026 »
  reviewUrl: string | null; // null si l'opérateur n'a pas configuré de lien d'avis
  supportUrl: string;
}

export default function OrderConfirmed({
  operatorName,
  photoCount,
  downloadUrl,
  orderLabel,
  amountLabel,
  orderRef,
  orderDateLabel,
  cardLabel,
  sellerLine,
  cgvUrl,
  cgvDateLabel,
  reviewUrl,
  supportUrl,
}: OrderConfirmedProps) {
  const meta = { fontSize: 12, color: brand.ink3, paddingTop: 4 };
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

          {/* Le reçu. Il vaut confirmation écrite du contrat (Code de la
              consommation, L221-13) : il reprend le prix payé, le moyen de
              paiement et l'accord du client pour une livraison immédiate. */}
          <Section style={{ padding: "20px 22px 0" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0} style={{ border: `1px solid ${brand.line}`, borderRadius: 14 }}>
              <tbody>
                <tr>
                  <td style={{ padding: "14px 15px 13px", fontFamily: brand.fontBody, fontSize: 13, color: brand.ink2 }}>
                    <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
                      <tbody>
                        <tr>
                          <td colSpan={2} style={{ paddingBottom: 9, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: brand.ink4 }}>
                            Reçu
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: 9 }}>{orderLabel}</td>
                          <td align="right" style={{ paddingBottom: 9, whiteSpace: "nowrap" }}>{amountLabel}</td>
                        </tr>
                        <tr>
                          <td style={{ borderTop: `1px solid ${brand.line}`, paddingTop: 9, fontWeight: 600, color: brand.ink }}>Total payé</td>
                          <td align="right" style={{ borderTop: `1px solid ${brand.line}`, paddingTop: 9, fontWeight: 600, color: brand.ink, whiteSpace: "nowrap" }}>
                            {amountLabel}
                          </td>
                        </tr>
                        <tr>
                          <td style={meta}>Commande {orderRef}</td>
                          <td align="right" style={meta}>{orderDateLabel}</td>
                        </tr>
                        {cardLabel && (
                          <tr>
                            <td style={meta}>Carte</td>
                            <td align="right" style={meta}>{cardLabel}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan={2} style={{ paddingTop: 10 }}>
                            <Text style={{ ...s.small, margin: 0, paddingTop: 10, borderTop: `1px solid ${brand.line2}`, fontSize: 11.5, lineHeight: "1.5" }}>
                              Livraison immédiate demandée à la commande : droit de rétractation non applicable (art. L221-28 du Code de la consommation).
                            </Text>
                          </td>
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
            <Text style={s.small}>Votre lien de téléchargement reste actif 90 jours.</Text>
            <Text style={{ ...s.small, marginTop: 7 }}>
              <strong style={{ color: brand.ink2 }}>Vendeur</strong> · {sellerLine}
            </Text>
            <Text style={{ ...s.small, marginTop: 7 }}>
              Une photo défectueuse ou différente de l&rsquo;aperçu ? Répondez à cet e-mail, le vendeur vous la rembourse.{" "}
              <Link href={cgvUrl} style={{ color: brand.ink3 }}>Conditions de vente du {cgvDateLabel}</Link>
            </Text>
            <Text style={{ ...s.small, marginTop: 7 }}>
              {operatorName} via Linktrip ·{" "}
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
  orderLabel: "Parapente, samedi 22 juillet · 5 photos",
  amountLabel: "22,00 €",
  orderRef: "SV-4821",
  orderDateLabel: "22/07/2026",
  cardLabel: "Visa •••• 4242",
  sellerLine: "Annecy Vol Libre, 12 route du Col, 74210 Doussard · SIRET 123 456 789 00012 · TVA non applicable, art. 293 B du CGI",
  cgvUrl: "https://linktrip.co/cgv",
  cgvDateLabel: "29 septembre 2026",
  reviewUrl: "https://g.page/r/example/review",
  supportUrl: "https://linktrip.co/g/julie-4k2p",
} satisfies OrderConfirmedProps;
