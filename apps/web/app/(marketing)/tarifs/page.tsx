import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import landing from "../landing.module.css";
import "./tarifs.css";

/* Page /tarifs — portée depuis docs/maquette-tarifs-v1.html (piste A du bloc
   des formules, cf. docs/maquette-tarifs-formules-options.html).

   La feuille `tarifs.css` est GLOBALE, pas un module, et tout y est préfixé
   par `.pt` : même vocabulaire de classes que la maquette et que produit.css.

   La grille : 20 % sur chaque vente, 10 % quand le client achète dans les
   24 h qui suivent la fin de la sortie, 29 € par mois pour le mode « vous
   les offrez ». Trois points restent à trancher côté produit, cf. la note
   de fin de fichier. */

export const metadata: Metadata = {
  title: "Linktrip — Tarif : 20 % par vente, 10 % dans les 24 heures",
  description:
    "Vendre vos photos ne coûte rien par mois : Linktrip prend 20 % sur chaque vente, et 10 % quand le client achète dans les 24 heures. Les offrir contre un e-mail et un avis coûte 29 € par mois.",
  alternates: { canonical: "/tarifs" },
};

/* Balisage FAQPage : Google indexe les questions de la section #faq. Toute
   modification des <details> ci-dessous doit être répercutée ici. */
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ["Quand est-ce que je suis payé ?", "Chaque vente arrive sur votre compte Stripe, puis part vers votre banque au rythme que vous y avez réglé. L'argent ne transite jamais par nous."],
    ["Le taux à 10 %, il faut le demander ?", "Non. Il s'applique tout seul, vente par vente, selon l'heure de l'achat. Votre relevé indique le taux retenu sur chaque ligne."],
    ["Et si je ne vends rien ce mois-ci ?", "Vous ne recevez pas de facture. La commission se déclenche à la vente, et seulement là."],
    ["Les frais Stripe sont-ils compris ?", "Stripe prélève ses frais de transaction sur chaque paiement, comme pour vos réservations. Notre commission se calcule sur le montant de la vente."],
    ["Je peux passer d'une formule à l'autre ?", "Oui, depuis vos réglages. Le changement vaut pour les sorties suivantes, les galeries déjà ouvertes gardent leur mode."],
  ].map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const CHECK = <svg className="ico ico--s" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg>;

const VENTE = [
  "Galeries et liens illimités",
  "Vos prix, fixés par vous",
  "Aperçus floutés et filigranés",
  "Relance des clients qui n'ont pas acheté",
  "Paiement Stripe, sur votre compte",
];

const CADEAU = [
  "Les mêmes galeries, sans page de paiement",
  "Chaque client laisse son adresse e-mail",
  "Le droit à l'image est accepté avant le téléchargement",
  "L'avis est demandé juste après",
  "La liste de vos clients vous appartient",
];

const GRATUIT = [
  "L'inscription et la création de votre compte",
  "Le stockage des photos, jusqu'à leur suppression au bout de 90 jours",
  "Les liens, les e-mails et les relances envoyés à vos clients",
  "Les sorties où personne n'achète",
  "Les mises à jour et l'assistance",
];

export default function TarifsPage() {
  return (
    <div className={`${landing.page} pt`}>
      {/* Même neutralisation que sur /produit : `.rail` impose min-height:100svh,
          pensé pour les pages où il encadre le premier écran. */}
      <div className={landing.rail} style={{ flex: "0 0 auto", minHeight: "auto" }}>
        <Header current="tarifs" />
      </div>

      <main>
        {/* ═══ 1 · Héros et formules ═══ */}
        <section className="rail top" id="formules">
          <div className="head reveal">
            <p className="kicker">Tarif</p>
            <h1 className="h1" style={{ marginTop: "14px" }}>Deux façons d&apos;utiliser Linktrip, <span className="grad">deux tarifs</span>.</h1>
            <p className="lead" style={{ marginTop: "16px" }}>Vous vendez les photos : nous prenons une commission sur chaque vente, et rien d&apos;autre. Vous les offrez contre une adresse e-mail et un avis : vous payez un abonnement.</p>
          </div>

          <div className="plans">
            <article className="card plan reveal">
              <h2 className="plan__name">
                <span><svg className="ico" viewBox="0 0 24 24"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 3 12V5a2 2 0 0 1 2-2h7a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 0 2.6Z" /><circle cx="7.6" cy="7.6" r="1.4" /></svg></span>
                Vous les vendez
              </h2>
              <p className="plan__desc">Vos clients achètent leurs photos dans la galerie, au prix que vous fixez. Ils paient par carte, depuis leur téléphone, en trois écrans.</p>
              <p className="plan__price"><b>20 %</b><em>sur chaque vente</em></p>
              <p className="plan__sub">Rien à l&apos;inscription, rien par mois.</p>
              <div className="plan__hi">
                <svg className="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5.4l3.4 2" /></svg>
                <div>
                  <b>10 % dans les 24 heures</b>
                  <p>Le taux tombe de moitié sur les ventes encaissées dans la journée qui suit la sortie.</p>
                </div>
              </div>
              <ul>
                {VENTE.map((l) => <li key={l}>{CHECK}<span>{l}</span></li>)}
              </ul>
              <div className="plan__cta">
                <Link href="/liste-attente" className="btn btn--full">Rejoindre la liste d&apos;attente <i>&rarr;</i></Link>
                <p className="plan__note">Pas de vente, pas de facture.</p>
              </div>
            </article>

            <article className="card plan reveal">
              <h2 className="plan__name">
                <span><svg className="ico" viewBox="0 0 24 24"><path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM3 7h18v4H3zM12 7v14M12 7S10.6 3 8.2 3a2.4 2.4 0 0 0 0 4.9M12 7s1.4-4 3.8-4a2.4 2.4 0 0 1 0 4.9" /></svg></span>
                Vous les offrez
              </h2>
              <p className="plan__desc">Vos clients repartent avec leurs photos sans payer. Ils laissent leur adresse e-mail, puis un avis.</p>
              <p className="plan__price"><b>29 €</b><em>par mois</em></p>
              <p className="plan__sub">TTC, sans engagement, résiliable à tout moment.</p>
              <div className="plan__hi plan__hi--flat">
                <svg className="ico" viewBox="0 0 24 24"><path d="M5 9.5h14M5 15h14" /></svg>
                <div>
                  <b>Le prix ne bouge pas</b>
                  <p>Quel que soit le nombre de sorties, de photos et de clients servis dans le mois.</p>
                </div>
              </div>
              <ul>
                {CADEAU.map((l) => <li key={l}>{CHECK}<span>{l}</span></li>)}
              </ul>
              <div className="plan__cta">
                <Link href="/liste-attente" className="btn btn--line btn--full">Rejoindre la liste d&apos;attente <i>&rarr;</i></Link>
                <p className="plan__note">Rien n&apos;est prélevé : il n&apos;y a pas de vente.</p>
              </div>
            </article>
          </div>

          <p className="plansNote reveal">Le mode se choisit une fois dans vos réglages, et vaut pour toutes vos sorties.</p>
        </section>

        {/* ═══ 2 · La règle des 24 heures ═══ */}
        <section className="band band--cream" id="vingt-quatre-heures" style={{ marginTop: "clamp(56px,6vw,100px)" }}>
          <div className="rail">
            <div className="head reveal">
              <p className="kicker">La règle des 24 heures</p>
              <h2 className="h2" style={{ marginTop: "14px" }}>Envoyez le lien le soir même, vos ventes passent à 10 %.</h2>
              <p className="lead" style={{ marginTop: "14px" }}>Le compte à rebours démarre à la fin de la sortie.</p>
            </div>

            <div className="card t24 reveal">
              <div className="t24__seg t24__seg--hot">
                <p className="t24__when"><svg className="ico ico--s" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5.4l3.4 2" /></svg>Les 24 premières heures</p>
                <b className="t24__rate num">10 %</b>
                <p>La sortie finit à 18 h : tout ce que vos clients achètent avant 18 h le lendemain compte à ce taux.</p>
              </div>
              <div className="t24__seg">
                <p className="t24__when"><svg className="ico ico--s" viewBox="0 0 24 24"><path d="M3 12h18M14 7l5 5-5 5" /></svg>Après 24 heures</p>
                <b className="t24__rate num">20 %</b>
                <p>Le lien reste ouvert et les relances continuent. La commission revient à son taux normal.</p>
              </div>
            </div>

            <p className="t24__foot reveal">Vos clients achètent surtout pendant qu&apos;ils sont encore dedans. Le taux réduit tombe donc sur la plus grosse partie de vos ventes, et il ne dépend que de la vitesse à laquelle vous déposez les photos.</p>
          </div>
        </section>

        {/* ═══ 3 · Ce que nous ne facturons pas ═══ */}
        <section className="band">
          <div className="rail">
            <div className="head reveal">
              <p className="kicker">Aucun frais caché</p>
              <h2 className="h2" style={{ marginTop: "14px" }}>Ce que nous ne facturons pas.</h2>
            </div>
            <div className="card free reveal">
              <ul>
                {GRATUIT.map((l) => <li key={l}><span>{l}</span><b>0 €</b></li>)}
              </ul>
            </div>
          </div>
        </section>

        {/* ═══ 4 · Questions ═══ */}
        <section className="band" id="faq" style={{ paddingTop: "clamp(30px,3vw,56px)" }}>
          <div className="rail">
            <div className="head reveal">
              <p className="kicker">Questions</p>
              <h2 className="h2" style={{ marginTop: "14px" }}>Ce que vous nous demandez sur le tarif.</h2>
            </div>
            <div className="faq reveal">
              <details open><summary>Quand est-ce que je suis payé ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Chaque vente arrive sur votre compte Stripe, puis part vers votre banque au rythme que vous y avez réglé. L&apos;argent ne transite jamais par nous.</p></details>
              <details><summary>Le taux à 10 %, il faut le demander ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Non. Il s&apos;applique tout seul, vente par vente, selon l&apos;heure de l&apos;achat. Votre relevé indique le taux retenu sur chaque ligne.</p></details>
              <details><summary>Et si je ne vends rien ce mois-ci ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Vous ne recevez pas de facture. La commission se déclenche à la vente, et seulement là.</p></details>
              <details><summary>Les frais Stripe sont-ils compris ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Stripe prélève ses frais de transaction sur chaque paiement, comme pour vos réservations. Notre commission se calcule sur le montant de la vente.</p></details>
              <details><summary>Je peux passer d&apos;une formule à l&apos;autre ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Oui, depuis vos réglages. Le changement vaut pour les sorties suivantes, les galeries déjà ouvertes gardent leur mode.</p></details>
            </div>
          </div>
        </section>

        {/* ═══ 5 · CTA final ═══ */}
        <section className="rail" style={{ paddingBottom: "clamp(56px,6vw,96px)" }}>
          <div className="slab final reveal">
            <h2 className="h2">Prenez date pour l&apos;ouverture.</h2>
            <p className="lead" style={{ marginTop: "14px", color: "rgba(255,255,255,.66)" }}>Laissez votre e-mail, nous vous prévenons dès que les comptes ouvrent.</p>
            <EmailCaptureField
              source="tarifs-cta"
              idPrefix="tarifs-cta"
              event="footer_email_submit"
              formClassName="field field--dark"
              buttonClassName="btn"
              submitLabel="Rejoindre"
            />
            <p className="micro" style={{ color: "rgba(255,255,255,.4)" }}>Vous choisirez votre formule à l&apos;inscription</p>
          </div>
        </section>
      </main>

      {/* Sans JS, les éléments .reveal resteraient à opacity:0. */}
      <noscript>
        <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
      </noscript>
      <ScrollReveal />

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_LD) }}
      />
    </div>
  );
}
