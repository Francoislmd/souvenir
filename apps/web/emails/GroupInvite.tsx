import { Body, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import { brand, s } from "./brand";
import { Cta, Hero, Thumbs, buttonColor } from "./parts";

/**
 * Invitation à la boutique d'une sortie GROUPE, et ses deux relances.
 *
 * - "invite"   : envoyée par l'opérateur depuis la carte d'envoi.
 * - "reminder" : 1re relance, J+2, à ceux qui n'ont pas payé (lib/automations.ts).
 * - "last"     : 2e et dernière relance, J+6.
 *
 * Même gabarit pour les trois : seuls le titre, la phrase et le pied changent.
 * Les relances portent un lien de désinscription, l'invitation non.
 */

export type GroupEmailVariant = "invite" | "reminder" | "last";

const COPY: Record<GroupEmailVariant, { title: string; lead: string }> = {
  invite: { title: "Vos photos sont prêtes", lead: "Revivez la sortie et gardez vos meilleurs moments. Votre galerie est privée : seuls les participants de votre départ y ont accès." },
  reminder: { title: "Vos photos sont toujours là", lead: "Votre galerie privée vous attend, avec les photos de votre départ." },
  last: { title: "Dernier rappel", lead: "Votre galerie privée sera bientôt supprimée, avec les photos de votre départ." },
};

export interface GroupInviteProps {
  operatorName: string;
  operatorInitials: string;
  operatorColor: string;
  operatorLogoUrl?: string;
  activity: string;
  sortieDate: string;
  sortiePlace?: string;
  galleryUrl: string;
  /** Ancien bandeau flouté (lib/email-cover.ts) : plus affiché, la couverture du prestataire le remplace. */
  coverUrl?: string;
  variant?: GroupEmailVariant;
  /** « 20 décembre » : dernier jour en ligne (Sortie.purgeAt), affiché sur la dernière relance seulement. */
  purgeDate?: string;
  /** Relances uniquement : page de désinscription. */
  unsubUrl?: string;
  /** La photo de couverture du prestataire (Réglages), en tête du mail. */
  heroUrl?: string;
  /** « départ 10 h » */
  detail?: string;
  /** Vignettes très floutées des photos du départ, et leur nombre. */
  thumbs?: string[];
  photoCount?: number;
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
  variant = "invite",
  purgeDate,
  unsubUrl,
  heroUrl,
  detail,
  thumbs = [],
  photoCount = 0,
}: GroupInviteProps) {
  const copy = COPY[variant];
  return (
    <Html lang="fr">
      <Head />
      <Preview>{`${activity}, le ${sortieDate}. ${copy.lead}`}</Preview>
      <Body style={{ ...s.body, padding: "16px 8px" }}>
        <Container style={s.card}>
          <Hero
            operatorName={operatorName}
            operatorInitials={operatorInitials}
            operatorColor={operatorColor}
            operatorLogoUrl={operatorLogoUrl}
            heroUrl={heroUrl}
            subtitle={sortiePlace ? `Galerie privée officielle · ${sortiePlace}` : "Galerie privée officielle"}
          />

          <Section style={{ padding: "26px 24px 0" }}>
            <Text style={{ fontFamily: brand.fontBody, fontSize: "13px", fontWeight: 600, color: buttonColor(operatorColor), margin: 0 }}>
              {activity} · {sortieDate}
              {detail ? ` · ${detail}` : ""}
            </Text>
            <Text style={{ ...s.h1, fontSize: "26px", lineHeight: "1.15", letterSpacing: "-0.6px", marginTop: 6 }}>{copy.title}</Text>
            <Text style={{ ...s.lead, color: brand.ink2, fontSize: "16px", lineHeight: "1.6", margin: "10px 0 0" }}>{copy.lead}</Text>
          </Section>

          <Thumbs urls={thumbs} count={photoCount} href={galleryUrl} />

          <Section style={{ padding: "24px 24px 26px" }}>
            <Cta href={galleryUrl} label="Voir mes photos" color={operatorColor} />
            <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", textAlign: "center", marginTop: 12 }}>
              Ce lien est personnel · aucun compte à créer{variant === "last" && purgeDate ? ` · en ligne jusqu\u2019au ${purgeDate}` : ""}
            </Text>
          </Section>

          <Hr style={{ borderColor: brand.line, margin: 0 }} />
          <Section style={{ padding: "18px 24px 22px" }}>
            <Text style={{ ...s.small, color: brand.ink3, fontSize: "13px", lineHeight: "1.6" }}>
              Une question&nbsp;? Répondez à ce mail, il arrive directement chez {operatorName}.
            </Text>
            <Text style={{ ...s.small, marginTop: 6 }}>
              Envoyé par {operatorName} via Linktrip
              {unsubUrl ? (
                <>
                  {" · "}
                  <Link href={unsubUrl} style={{ color: brand.ink3 }}>
                    ne plus recevoir de rappel
                  </Link>
                </>
              ) : null}
              .
            </Text>
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
