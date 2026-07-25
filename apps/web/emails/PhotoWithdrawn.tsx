import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";

/**
 * Souvenir — notification interne : demande de retrait d'une photo (mode
 * GROUPE uniquement, brief §5). Adressée à l'opérateur, pas au client — pas
 * de branding client, pas de désinscription, gabarit volontairement sobre.
 */

export interface PhotoWithdrawnProps {
  operatorName: string;
  activity: string;
  sortieDate: string;
  slotLabel: string;
  galleryUrl: string; // lien vers la sortie, côté app opérateur
}

export default function PhotoWithdrawn({ operatorName, activity, sortieDate, slotLabel, galleryUrl }: PhotoWithdrawnProps) {
  return (
    <Html lang="fr">
      <Head />
      <Preview>Une photo a été retirée de votre galerie de groupe.</Preview>
      <Body style={s.body}>
        <Container style={s.card}>
          <Section style={{ padding: 22 }}>
            <Text style={s.h1}>Une photo a été retirée</Text>
            <Text style={s.lead}>
              Un client de votre sortie {activity} du {sortieDate} (créneau {slotLabel}) a demandé le retrait d&rsquo;une photo — sans justification, comme
              promis. Elle a été masquée immédiatement, partout.
            </Text>
            <Text style={{ ...s.lead, marginTop: 12 }}>
              <Link href={galleryUrl} style={{ color: brand.ink }}>
                Voir la sortie
              </Link>
            </Text>
          </Section>
          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "16px 22px 22px" }}>
            <Text style={s.small}>Envoyé par Souvenir pour {operatorName}.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

PhotoWithdrawn.PreviewProps = {
  operatorName: "Canyon Aventure",
  activity: "Canyoning",
  sortieDate: "22 juillet",
  slotLabel: "11 h 00",
  galleryUrl: "https://linktrip.co/sorties/abc123",
} satisfies PhotoWithdrawnProps;
