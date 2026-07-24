import { Body, Container, Head, Hr, Html, Img, Link, Preview, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — email 2 · RELANCE À 2H (catégorie marketing).
 *
 * Envoyé si la galerie n'a pas été ouverte 2h après la livraison. Même
 * structure que PhotosReady, en plus court : aucune offre, aucune pression —
 * la plupart des gens sont encore sur la route.
 */

export interface PhotosReminderProps {
  operatorName: string;
  activity: string;
  sortieDate: string;
  sortieTime: string;
  sortiePlace?: string;
  heroUrl: string | null;
  photoCount: number;
  galleryUrl: string;
  unsubUrl: string;
}

export default function PhotosReminder({
  operatorName,
  activity,
  sortieDate,
  sortieTime,
  sortiePlace,
  heroUrl,
  photoCount,
  galleryUrl,
  unsubUrl,
}: PhotosReminderProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Le lien est toujours actif.</Preview>
      <Body style={s.body}>
        <Container style={s.card}>

          <Section style={{ padding: "18px 22px 0" }}>
            <Text style={s.small}>
              {operatorName} · Sortie du {sortieDate}
            </Text>
          </Section>

          {heroUrl && (
            <Section style={{ padding: "14px 22px 0" }}>
              <Link href={galleryUrl}>
                <Img src={heroUrl} width={516} height={220} alt={`Votre sortie du ${sortieDate}`}
                     style={{ display: "block", width: "100%", maxWidth: 516, height: 220, objectFit: "cover", borderRadius: 14 }} />
              </Link>
            </Section>
          )}

          <Section style={{ padding: "20px 22px 0" }}>
            <Text style={{ ...s.h1, fontSize: "19px", letterSpacing: "-0.4px" }}>
              Vous ne les avez pas encore regardées
            </Text>
            <Text style={s.lead}>
              {activity}{sortiePlace ? ` à ${sortiePlace}` : ""}, le {sortieDate} à {sortieTime}.
            </Text>
            <Text style={{ ...s.lead, marginTop: 4 }}>
              {photoCount} photo{photoCount > 1 ? "s" : ""} {photoCount > 1 ? "sont prêtes" : "est prête"}, en pleine résolution.
            </Text>
          </Section>

          <Section style={{ padding: "20px 22px 24px" }}>
            <table width="100%" cellPadding={0} cellSpacing={0} border={0}>
              <tbody>
                <tr>
                  <td align="center" style={s.buttonCell(brand.ink)}>
                    <Link href={galleryUrl} style={s.buttonLink}>Ouvrir ma galerie</Link>
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

PhotosReminder.PreviewProps = {
  operatorName: "Annecy Vol Libre",
  activity: "Canyoning",
  sortieDate: "22 juillet",
  sortieTime: "14 h 30",
  sortiePlace: "Forclaz",
  heroUrl: "https://placehold.co/1032x310/FFC58E/FFF.jpg",
  photoCount: 9,
  galleryUrl: "https://linktrip.co/g/julie-4k2p",
  unsubUrl: "https://linktrip.co/g/julie-4k2p/desinscription",
} satisfies PhotosReminderProps;
