import {
  Body, Column, Container, Head, Hr, Html, Img, Link,
  Preview, Row, Section, Text,
} from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — email 1 · LIVRAISON (catégorie transactionnelle).
 *
 * C'est LE gabarit de référence : les autres emails reprennent exactement
 * cette structure (en-tête opérateur, image, accroche, bouton unique, pied).
 *
 * Règles non négociables reprises ici :
 *  · le pré-en-tête est présent et masqué
 *  · les photos sont des <Img> hébergées, jamais des dégradés CSS
 *  · un seul bouton, qui dit « Voir mes photos » et non « Acheter »
 *  · pied avec conservation 90 jours + lien de suppression
 */

export interface PhotosReadyProps {
  firstName: string; // « Julie »
  operatorName: string; // « Annecy Vol Libre »
  operatorInitials: string; // « AV »
  operatorColor: string; // couleur choisie par l'opérateur, ex. « #FF5A1F »
  sortieDate: string; // « 22 juillet »
  sortiePlace?: string; // « Forclaz »
  freeCount: number; // 2
  paidCount: number; // 7
  // JPEG hébergé, 1120 px de large (2×) — null si le worker n'a pas encore
  // fini de traiter la première photo au moment de l'envoi (l'email part
  // quand même, jamais bloqué sur le traitement serveur).
  heroUrl: string | null;
  thumbUrls: string[]; // 3 aperçus floutés, générés côté serveur
  galleryUrl: string; // https://linktrip.co/g/{token}
  deleteUrl: string;
  unsubUrl: string;
}

export default function PhotosReady({
  firstName,
  operatorName,
  operatorInitials,
  operatorColor,
  sortieDate,
  sortiePlace,
  freeCount,
  paidCount,
  heroUrl,
  thumbUrls,
  galleryUrl,
  deleteUrl,
  unsubUrl,
}: PhotosReadyProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${freeCount} photos vous sont offertes — elles vous attendent.`}</Preview>
      <Body style={s.body}>
        <Container style={s.card}>

          {/* — en-tête : c'est la marque de l'OPÉRATEUR, pas celle de Souvenir — */}
          <Section style={{ padding: "18px 22px", borderBottom: `1px solid ${brand.line}` }}>
            <Row>
              <Column style={{ width: 34, paddingRight: 11 }}>
                <table cellPadding={0} cellSpacing={0} border={0} width={34}
                       style={{ backgroundColor: operatorColor, borderRadius: 10 }}>
                  <tbody>
                    <tr>
                      <td height={34} align="center"
                          style={{ color: brand.white, fontFamily: brand.fontHead, fontWeight: 700, fontSize: 12 }}>
                        {operatorInitials}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </Column>
              <Column>
                <Text style={{ ...s.h1, fontSize: "15px", letterSpacing: "-0.2px", margin: 0 }}>
                  {operatorName}
                </Text>
                <Text style={{ ...s.small, marginTop: 2 }}>
                  Sortie du {sortieDate}{sortiePlace ? ` · ${sortiePlace}` : ""}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* — la photo passe avant le texte, quand elle est déjà prête — */}
          {/* Hauteur fixe + object-fit : une photo portrait ne doit pas rendre
              l'email démesurément long, ni une photo panoramique trop basse. */}
          {heroUrl && (
            <Section>
              <Link href={galleryUrl}>
                <Img src={heroUrl} width={560} height={380} alt={`Votre sortie du ${sortieDate}`}
                     style={{ display: "block", width: "100%", maxWidth: brand.width, height: 380, objectFit: "cover" }} />
              </Link>
            </Section>
          )}

          {/* — accroche — */}
          <Section style={{ padding: "24px 22px 0" }}>
            <Text style={s.h1}>{firstName}, vos photos sont là</Text>
            <Text style={s.lead}>
              <span style={{ color: brand.ink, fontWeight: 600 }}>
                {freeCount} sont déjà à vous.
              </span>{" "}
              Les {paidCount} autres vous attendent en pleine résolution.
            </Text>
          </Section>

          {/* — un seul bouton — */}
          <Section style={{ padding: 22 }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td align="center" style={s.buttonCell(brand.ink)}>
                    <Link href={galleryUrl} style={s.buttonLink}>Voir mes photos</Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={{ ...s.small, textAlign: "center", marginTop: 11 }}>
              Aucun compte à créer · lien valable 90 jours
            </Text>
          </Section>

          {/* — aperçus floutés (JPEG pré-générés côté serveur) — */}
          {thumbUrls.length > 0 && (
            <Section style={{ padding: "0 22px 6px" }}>
              <Text style={{ ...s.small, fontFamily: brand.fontHead, fontWeight: 700, fontSize: 11,
                             letterSpacing: "1.4px", textTransform: "uppercase", paddingBottom: 10 }}>
                Aussi dans votre galerie
              </Text>
              <Row>
                {thumbUrls.slice(0, 3).map((url, i) => (
                  <Column key={url} style={{ width: "33%", padding: i === 1 ? "0 3px" : 0 }}>
                    <Link href={galleryUrl}>
                      {/* Photos sources de toutes proportions (portrait, paysage…) — hauteur
                          fixe + object-fit pour une grille régulière, jamais étirée. */}
                      <Img src={url} width={165} height={165} alt="" style={{ display: "block", width: "100%", height: 165, objectFit: "cover", borderRadius: 10 }} />
                    </Link>
                  </Column>
                ))}
              </Row>
            </Section>
          )}

          {/* — pied : RGPD + désinscription — */}
          <Hr style={{ borderColor: brand.line, margin: "20px 0 0" }} />
          <Section style={{ padding: "16px 22px 22px" }}>
            <Text style={s.small}>
              Vos photos sont conservées 90 jours puis supprimées.{" "}
              <Link href={deleteUrl} style={{ color: brand.ink3 }}>Les supprimer maintenant</Link>.
              <br />
              Envoyé par {operatorName} via Souvenir ·{" "}
              <Link href={unsubUrl} style={{ color: brand.ink3 }}>ne plus recevoir ces messages</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

PhotosReady.PreviewProps = {
  firstName: "Julie",
  operatorName: "Annecy Vol Libre",
  operatorInitials: "AV",
  operatorColor: "#FF5A1F",
  sortieDate: "22 juillet",
  sortiePlace: "Forclaz",
  freeCount: 2,
  paidCount: 7,
  heroUrl: "https://placehold.co/1120x460/7FC5EE/FFF.jpg",
  thumbUrls: [
    "https://placehold.co/330x330/F3C9A0/FFF.jpg",
    "https://placehold.co/330x330/FFC58E/FFF.jpg",
    "https://placehold.co/330x330/AEDCF3/FFF.jpg",
  ],
  galleryUrl: "https://linktrip.co/g/julie-4k2p",
  deleteUrl: "https://linktrip.co/g/julie-4k2p/supprimer",
  unsubUrl: "https://linktrip.co/g/julie-4k2p/desinscription",
} satisfies PhotosReadyProps;
