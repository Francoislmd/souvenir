import type { ReactNode } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { FaqCta } from "./FaqCta";
import styles from "./Faq.module.css";

/* Section « FAQ » — dernier bloc avant le pied de page (cf.
   docs/maquette-faq-v3.html, combinaison validée : mise en page A, titre 2,
   réponse 1 à l'objection, fond blanc).

   Trois choses à savoir avant d'y toucher :

   1. L'accordéon est exclusif SANS JavaScript : c'est l'attribut `name` partagé
      par tous les <details> (accordéon natif). Les navigateurs qui ne le
      connaissent pas laissent simplement plusieurs réponses ouvertes, ce qui
      reste lisible. Ne pas réintroduire de state React pour ça.
   2. Le pied de section (CTA + adresse) est rendu DEUX fois : dans la colonne
      sticky en bureau, sous la liste en mobile. Un seul nœud imposerait de
      choisir entre un CTA orphelin en bas d'une colonne vide et un CTA glissé
      entre l'intro et les questions. L'un des deux est toujours en
      `display:none`.
   3. Chaque réponse existe en deux versions : le JSX affiché et `plain`, sa
      version texte pour le JSON-LD FAQPage. Toute modification de l'un doit
      être répercutée sur l'autre, sinon Google indexe une réponse périmée. */

interface Question {
  q: string;
  a: ReactNode;
  /** Même réponse, en texte brut, pour le balisage FAQPage. */
  plain: string;
}

const QUESTIONS: Question[] = [
  {
    q: "Combien coûte Linktrip ?",
    a: (
      <>
        L&rsquo;inscription et l&rsquo;usage de la plateforme sont gratuits. Linktrip prélève une commission de
        20&nbsp;% sur chaque vente, sans abonnement ni engagement de durée.
      </>
    ),
    plain:
      "L’inscription et l’usage de la plateforme sont gratuits. Linktrip prélève une commission de 20 % sur chaque vente, sans abonnement ni engagement de durée.",
  },
  {
    q: "Je donne déjà mes photos à mes clients, quel intérêt ?",
    a: (
      <>
        Vous pouvez continuer&nbsp;: fixez le nombre de photos offertes à chaque participant, les suivantes sont
        proposées à la vente. La galerie vous rapporte en plus des adresses clients, des avis Google et des partages en
        story, ce qu&rsquo;un envoi WhatsApp ne laisse pas.
      </>
    ),
    plain:
      "Vous pouvez continuer : fixez le nombre de photos offertes à chaque participant, les suivantes sont proposées à la vente. La galerie vous rapporte en plus des adresses clients, des avis Google et des partages en story, ce qu’un envoi WhatsApp ne laisse pas.",
  },
  {
    q: "Quand les fonds me sont-ils versés ?",
    a: (
      <>
        Les paiements sont encaissés par Stripe sur votre compte, puis virés selon votre calendrier de versement.
        Linktrip ne détient vos fonds à aucun moment.
      </>
    ),
    plain:
      "Les paiements sont encaissés par Stripe sur votre compte, puis virés selon votre calendrier de versement. Linktrip ne détient vos fonds à aucun moment.",
  },
  {
    q: "Que reste-t-il à ma charge après une sortie ?",
    a: (
      <>
        Le dépôt des photos. La création de la galerie, l&rsquo;envoi du lien, les relances et la livraison des fichiers
        sont automatisés.
      </>
    ),
    plain:
      "Le dépôt des photos. La création de la galerie, l’envoi du lien, les relances et la livraison des fichiers sont automatisés.",
  },
  {
    q: "Faut-il investir dans du matériel ou installer une application ?",
    a: (
      <>
        Ni l&rsquo;un ni l&rsquo;autre. L&rsquo;appareil photo ou le téléphone que vous utilisez déjà suffit, et la
        plateforme fonctionne depuis un navigateur.
      </>
    ),
    plain:
      "Ni l’un ni l’autre. L’appareil photo ou le téléphone que vous utilisez déjà suffit, et la plateforme fonctionne depuis un navigateur.",
  },
  {
    q: "Comment mes clients accèdent-ils à leurs photos ?",
    a: (
      <>
        Ils reçoivent un lien privé par e-mail ou WhatsApp à l&rsquo;issue de la sortie. Aucun compte n&rsquo;est
        requis&nbsp;: ils consultent, sélectionnent, paient et téléchargent.
      </>
    ),
    plain:
      "Ils reçoivent un lien privé par e-mail ou WhatsApp à l’issue de la sortie. Aucun compte n’est requis : ils consultent, sélectionnent, paient et téléchargent.",
  },
  {
    q: "Qui définit les tarifs ?",
    a: (
      <>
        Vous. Le prix à l&rsquo;unité et celui du pack complet se paramètrent dans votre espace et restent modifiables à
        tout moment.
      </>
    ),
    plain:
      "Vous. Le prix à l’unité et celui du pack complet se paramètrent dans votre espace et restent modifiables à tout moment.",
  },
  {
    q: "Mes photos peuvent-elles être récupérées sans paiement ?",
    a: (
      <>
        Non. Seuls des aperçus floutés et filigranés circulent avant l&rsquo;achat. Le fichier haute définition
        n&rsquo;est délivré qu&rsquo;après confirmation du paiement.
      </>
    ),
    plain:
      "Non. Seuls des aperçus floutés et filigranés circulent avant l’achat. Le fichier haute définition n’est délivré qu’après confirmation du paiement.",
  },
  {
    q: "Comment le droit à l’image est-il géré ?",
    a: (
      <>
        Chaque participant donne son consentement avant de recevoir ses photos et peut en demander la suppression depuis
        sa galerie, sans intervention de votre part.
      </>
    ),
    plain:
      "Chaque participant donne son consentement avant de recevoir ses photos et peut en demander la suppression depuis sa galerie, sans intervention de votre part.",
  },
  {
    q: "Où sont hébergées les photos, et pendant combien de temps ?",
    a: (
      <>
        Sur des serveurs situés en Europe, conformément au RGPD. Les fichiers sont supprimés automatiquement 90 jours
        après la sortie.
      </>
    ),
    plain:
      "Sur des serveurs situés en Europe, conformément au RGPD. Les fichiers sont supprimés automatiquement 90 jours après la sortie.",
  },
  {
    q: "La plateforme convient-elle aux sorties en groupe ?",
    a: (
      <>
        Oui. Les photos sont classées par créneau et un lien unique couvre la sortie&nbsp;: chaque participant y
        retrouve les siennes.
      </>
    ),
    plain:
      "Oui. Les photos sont classées par créneau et un lien unique couvre la sortie : chaque participant y retrouve les siennes.",
  },
  {
    q: "Quels revenus puis-je espérer ?",
    a: (
      <>
        Ils dépendent de votre tarif et de la part de clients qui achètent.{" "}
        <Link href="/simulation">Le simulateur</Link> en donne une estimation en quelques secondes.
      </>
    ),
    plain:
      "Ils dépendent de votre tarif et de la part de clients qui achètent. Le simulateur en donne une estimation en quelques secondes.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: QUESTIONS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.plain },
  })),
};

function Tail({ className }: { className: string }) {
  return (
    <div className={className}>
      <FaqCta />
    </div>
  );
}

export function Faq() {
  return (
    <section className={styles.section} aria-labelledby="faq">
      {/* Sans JS, .reveal (globals.css) resterait à opacity:0. */}
      <noscript>
        <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
      </noscript>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />

      <div className={styles.wrap}>
        <div className={styles.aside}>
          <p className={`${styles.eyebrow} reveal`}>Questions fréquentes</p>
          <h2 id="faq" className={`${styles.h2} reveal reveal-d1`}>
            Tout ce qu&rsquo;il faut savoir avant de commencer.
          </h2>
          <p className={`${styles.sub} reveal reveal-d2`}>
            Commission, versement des fonds, droit à l&rsquo;image, protection des fichiers. Douze réponses avant de
            vous décider.
          </p>
          <Tail className={`${styles.tail} ${styles.tailDesk} reveal reveal-d3`} />
        </div>

        <div className={`${styles.list} reveal reveal-d2`}>
          {QUESTIONS.map((item, i) => (
            <details key={item.q} className={styles.qa} name="faq-accueil" open={i === 0}>
              <summary className={styles.summary}>
                {item.q}
                <span className={styles.sign} aria-hidden="true" />
              </summary>
              <p className={styles.ans}>{item.a}</p>
            </details>
          ))}
        </div>

        <Tail className={`${styles.tail} ${styles.tailMobile}`} />
      </div>

      <ScrollReveal />
    </section>
  );
}

export default Faq;
