/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { DemoArcade } from "@/components/marketing/DemoArcade";
import { RevenueSlider } from "@/components/marketing/RevenueSlider";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import landing from "../landing.module.css";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Parcours } from "./Parcours";
import { Filigrane } from "./Filigrane";
import "./produit.css";

/* Page pilier /produit — portée depuis docs/maquette-produit-v1.html.
   Spec : docs/SPEC-page-produit.md · Direction artistique : docs/DA-page-produit.md

   Trois choses à savoir avant d'y toucher :

   1. La feuille `produit.css` est GLOBALE, pas un module, et tout y est préfixé
      par `.pp` (la classe racine ci-dessous). Le moteur de scènes animées de
      <Parcours> repose sur des sélecteurs d'attribut (`[class^="sc"]`) qu'un
      module CSS casserait en hachant les noms de classe.
   2. Les images vivent dans `public/produit/`. Elles sont déjà recadrées et
      compressées au format d'affichage : passer à next/image demanderait de
      reprendre les ratios un par un, c'est un chantier séparé.
   3. Deux promesses de cette page ne sont pas encore tenues par le produit :
      la synchronisation avec une plateforme de réservation (étape 01) et le
      mode « Vous les offrez ». Arbitré comme assumé pour une landing de
      pré-lancement, cf. SPEC. À revoir à l'ouverture des comptes. */

export const metadata: Metadata = {
  title: "Linktrip — Les photos de vos sorties, enfin réglées",
  description:
    "Vous videz votre carte mémoire, chaque client reçoit un lien avec ses photos, et ceux qui veulent les garder paient. Sans abonnement, sans engagement, sans matériel.",
  alternates: { canonical: "/produit" },
};

/* Balisage FAQPage : Google indexe les questions de la section #faq. Toute
   modification des <details> ci-dessous doit être répercutée ici. */
const FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    ["Combien coûte Linktrip ?", "Rien à l'inscription, rien par mois. Linktrip prend 20 % sur chaque vente. Pas de vente, pas de facture."],
    ["Quand est-ce que je suis payé ?", "Chaque vente arrive sur votre compte Stripe, puis part vers votre banque au rythme que vous y avez réglé. L'argent ne transite jamais par nous."],
    ["Il me faut du matériel ?", "L'appareil ou le téléphone que vous utilisez déjà suffit. Le reste se fait depuis un navigateur, rien à installer."],
    ["On peut récupérer les photos sans payer ?", "Non. Avant l'achat, seuls des aperçus floutés et filigranés circulent. Le fichier net n'est délivré qu'une fois le paiement confirmé."],
    ["Et le droit à l'image ?", "Chaque participant donne son accord avant de recevoir ses photos, et peut demander leur suppression depuis sa galerie, sans passer par vous. Tout est effacé automatiquement 90 jours après la sortie."],
  ].map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function ProduitPage() {
  return (
    <div className={`${landing.page} pp`}>
      {/* Le header attend `.page` (pour --gutter) et `.rail` (pour ses marges)
          comme ancêtres. `flex: 0 0 auto` l'empêche d'absorber la hauteur que
          `.rail` réclame d'ordinaire sur les pages en un seul écran — mais
          `.rail` impose aussi `min-height: 100svh` (pensé pour les pages où
          .rail encadre tout le premier écran), donc il faut aussi le
          neutraliser ici, sans quoi le header à lui seul pousse le reste de
          la page hors de l'écran. */}
      <div className={landing.rail} style={{ flex: "0 0 auto", minHeight: "auto" }}>
        <Header current="produit" />
      </div>

      <main>
        {/* ═══ 1 · Héros ═══ */}
        <section className="rail" id="produit">
          <div className="hero">
            <div className="card hero__card reveal">
              <p className="kicker">Le produit</p>
              <h1 className="h1" style={{ marginTop: "14px" }}>Les photos de vos sorties, <span className="grad">enfin réglées.</span></h1>
              <ul className="hero__list">
                <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span><b>Le soir, vous videz votre carte mémoire.</b> Les photos se rangent seules, par créneau.</span></li>
                <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span><b>Chaque client reçoit un lien avec ses photos.</b> Sans compte, sans application, sans mot de passe.</span></li>
                <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span><b>Ceux qui veulent les garder paient.</b> L&apos;argent arrive sur votre compte, jamais sur le nôtre.</span></li>
              </ul>
              <div className="hero__cta">
                <EmailCaptureField
                  source="produit-hero"
                  idPrefix="produit-hero"
                  event="hero_email_submit"
                  formClassName="field"
                  buttonClassName="btn"
                  submitLabel="Rejoindre"
                />
                <p className="micro">Sans abonnement · Sans engagement<span className="onlyWide"> · Sans matériel</span></p>
              </div>
            </div>

            <div className="hero__panel reveal">
              <img className="hero__photo" src="/produit/hero.webp" alt="Trois participants sur une bouée tractée, à la fin de la sortie" />
              <div className="hero__prot" aria-hidden="true">
                <img className="hero__photo" src="/produit/hero-blur.webp" alt="" />
                <Filigrane rows={7} cols={5} />
              </div>
              <span className="hero__seam" aria-hidden="true"></span>
              <span className="hero__lock" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" /><path d="M12 14v2.5" /></svg></span>
            </div>
          </div>
        </section>

        <Parcours />

        {/* ═══ 3 · Les deux modes ═══ */}
        <section className="band" id="modes">
          <div className="rail">
            <div style={{ textAlign: "center", maxWidth: "660px", margin: "0 auto" }}>
              <p className="kicker reveal">Deux façons de s&apos;en servir</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Vendez vos photos. Ou offrez-les.</h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>Le choix se fait une fois, dans vos réglages. Il vaut ensuite pour toutes vos sorties.</p>
            </div>

            <div className="modes">
              <article className="mode card reveal">
                <div className="modeShot">
                  <img src="/produit/modeb-blur.webp" alt="La galerie d'une sortie, floutée et filigranée tant qu'elle n'est pas payée" />
                  <span className="modeVeil" aria-hidden="true"></span>
                  <Filigrane rows={6} cols={4} />
                  <span className="modeLock" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" /><path d="M12 14v2.5" /></svg></span>
                  <span className="modeTag">24 € les 12 photos</span>
                  <div className="modeName">
                    <span className="modeIco"><svg viewBox="0 0 24 24"><path d="M4.6 11.4 11.4 4.6h6.1a1.9 1.9 0 0 1 1.9 1.9v6.1l-6.8 6.8a1.9 1.9 0 0 1-2.7 0l-5.3-5.3a1.9 1.9 0 0 1 0-2.7Z" /><circle cx="16.4" cy="7.6" r="1.5" /></svg></span>
                    <h3>Vous les vendez</h3>
                  </div>
                </div>
                <div className="modeTxt">
                  <p className="modeLead">Vos clients paient leurs photos, au prix que vous fixez.</p>
                  <p className="modeDetail">Vous décidez du prix d&apos;une photo et de celui du pack complet. Le client paie par carte depuis sa galerie, et l&apos;argent va sur votre compte Stripe. Jamais sur le nôtre.</p>
                  <p className="modeGain"><b>Un revenu en plus</b><small>Sur des sorties que vous photographiez déjà</small></p>
                </div>
              </article>

              <article className="mode card reveal">
                <div className="modeShot">
                  <img src="/produit/modeb.webp" alt="La même galerie, livrée nette au client" />
                  <span className="modeTag modeTag--ink">Offert</span>
                  <div className="modeName">
                    <span className="modeIco"><svg viewBox="0 0 24 24"><path d="M12 4.2l2.35 4.76 5.25.77-3.8 3.7.9 5.23L12 16.2l-4.7 2.47.9-5.24-3.8-3.7 5.25-.77Z" /></svg></span>
                    <h3>Vous les offrez</h3>
                  </div>
                </div>
                <div className="modeTxt">
                  <p className="modeLead">Vos clients repartent avec leurs photos, gratuitement.</p>
                  <p className="modeDetail">En échange, ils laissent leur e-mail et accordent leur droit à l&apos;image. La demande d&apos;avis part juste après, pendant qu&apos;ils sont encore dedans.</p>
                  <p className="modeGain"><b>Des avis et une liste de clients</b><small>Sans rien facturer à personne</small></p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ═══ 4 · Partage du travail ═══ */}
        <section className="band band--cream">
          <div className="rail">
            <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto" }}>
              <p className="kicker reveal">Qui fait quoi</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Votre part du travail tient en une ligne.</h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>Le reste tourne sans vous, y compris quand vous êtes sur l&apos;eau.</p>
            </div>

            <div className="card split reveal">
              <div className="split__side split__you">
                <div className="split__head"><strong>Vous</strong><em>1 ACTION</em></div>
                <ul>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 16v2.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V16" /></svg><span>Vous déposez les photos de la sortie.</span></li>
                </ul>
                <p className="rest">Le soir même ou le lendemain, depuis un navigateur.</p>
              </div>
              <div className="split__side split__us">
                <div className="split__head"><strong>Linktrip</strong><em>8 ACTIONS</em></div>
                <ul>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Récupère vos sorties depuis votre plateforme de réservation</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Crée la galerie et range les photos par créneau</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Envoie le lien privé par e-mail ou WhatsApp</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Floute et filigrane les aperçus</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Relance les clients qui n&apos;ont pas acheté</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Encaisse le paiement</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Livre les fichiers haute définition</span></li>
                  <li><svg className="ico" viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><span>Supprime tout au bout de 90 jours</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 5 · Démo ═══ */}
        {/* Même mécanique que l'accueil : trio de vignettes, puis la démo Arcade en
            plein écran. Le chapeau est passé en props, /produit y met son wording. */}
        <DemoArcade
          anchorId="demo"
          eyebrow="La démo"
          title={<>Regardez, c&apos;est plus rapide <span>que de le lire</span>.</>}
          sub="Le dépôt des photos, la galerie du client, la première vente. Une minute quarante."
        />

        {/* ═══ 6 · Simulateur ═══ */}
        {/* Le simulateur de la maquette était une dalle encre à trois curseurs figés.
            On lui substitue le composant réel : quatre curseurs, les vraies bornes et
            le suivi analytics. D'où le fond clair — ses libellés sont en encre. */}
        <section className="band" id="simulateur">
          <div className="rail">
            <div style={{ textAlign: "center", maxWidth: "660px", margin: "0 auto" }}>
              <p className="kicker reveal">Combien ça rapporte</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Faites le calcul avec vos chiffres.</h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>Réglez les curseurs sur votre activité réelle.</p>
            </div>
            <div className="reveal" style={{ marginTop: "clamp(26px,3vw,44px)" }}>
              <RevenueSlider />
            </div>
          </div>
        </section>

        {/* ═══ 7 · Activités ═══ */}
        <section className="band">
          <div className="rail">
            <div style={{ maxWidth: "700px" }}>
              <p className="kicker reveal">Activités</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Pensé pour les sorties où l&apos;on ne peut pas sortir son téléphone.</h2>
            </div>
            <div className="acts reveal">
              <Link className="act" href="/activites/canyoning"><img src="/produit/card-canyoning-cascade.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie de groupe</span><span className="act__name">Canyoning</span></Link>
              <Link className="act" href="/activites/rafting"><img src="/produit/card-rafting-eaux-vives.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie de groupe</span><span className="act__name">Rafting</span></Link>
              <Link className="act" href="/activites/plongee"><img src="/produit/card-snorkeling-surface.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie individuelle</span><span className="act__name">Plongée</span></Link>
              <Link className="act" href="/activites/parapente"><img src="/produit/card-parapente-biplace.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie individuelle</span><span className="act__name">Parapente</span></Link>
              <Link className="act" href="/activites/surf"><img src="/produit/card-surf-lecon.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie de groupe</span><span className="act__name">Surf</span></Link>
              <Link className="act" href="/activites/parc-aventure"><img src="/produit/card-tyrolienne-foret.webp" alt="" /><span className="act__veil"></span><span className="act__tag">Galerie de groupe</span><span className="act__name">Parc aventure</span></Link>
            </div>
            <p className="body reveal" style={{ marginTop: "20px" }}>Votre activité n&apos;est pas dans la liste ? Ça marche pareil.</p>
          </div>
        </section>

        {/* ═══ 8 · FAQ ═══ */}
        <section className="band" id="faq" style={{ paddingTop: "clamp(30px,3vw,56px)" }}>
          <div className="rail">
            <div style={{ textAlign: "center" }}>
              <p className="kicker reveal">Questions</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Les questions qui reviennent.</h2>
            </div>
            <div className="faq reveal">
              <details open><summary>Combien coûte Linktrip ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Rien à l&apos;inscription, rien par mois. Linktrip prend 20 % sur chaque vente. Pas de vente, pas de facture.</p></details>
              <details><summary>Quand est-ce que je suis payé ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Chaque vente arrive sur votre compte Stripe, puis part vers votre banque au rythme que vous y avez réglé. L&apos;argent ne transite jamais par nous.</p></details>
              <details><summary>Il me faut du matériel ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>L&apos;appareil ou le téléphone que vous utilisez déjà suffit. Le reste se fait depuis un navigateur, rien à installer.</p></details>
              <details><summary>On peut récupérer les photos sans payer ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Non. Avant l&apos;achat, seuls des aperçus floutés et filigranés circulent. Le fichier net n&apos;est délivré qu&apos;une fois le paiement confirmé.</p></details>
              <details><summary>Et le droit à l&apos;image ?<svg className="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></summary><p>Chaque participant donne son accord avant de recevoir ses photos, et peut demander leur suppression depuis sa galerie, sans passer par vous. Tout est effacé automatiquement 90 jours après la sortie.</p></details>
            </div>
          </div>
        </section>

        {/* ═══ 9 · CTA final ═══ */}
        <section className="rail" style={{ paddingBottom: "clamp(56px,6vw,96px)" }}>
          <div className="slab final reveal">
            <h2 className="h2">Commencez par votre prochaine sortie.</h2>
            <p className="lead" style={{ marginTop: "14px", color: "rgba(255,255,255,.66)" }}>Laissez votre e-mail, nous vous prévenons dès l&apos;ouverture des comptes.</p>
            <EmailCaptureField
              source="produit-cta"
              idPrefix="produit-cta"
              event="footer_email_submit"
              formClassName="field field--dark"
              buttonClassName="btn"
              submitLabel="Rejoindre"
            />
            <p className="micro" style={{ color: "rgba(255,255,255,.4)" }}>Sans abonnement · Sans engagement</p>
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
