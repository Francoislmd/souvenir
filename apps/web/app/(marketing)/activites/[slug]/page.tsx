/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Logo } from "@/components/brand/Logo";
import { ACTIVITY_ICONS } from "@/components/marketing/ActivityIcons";
import { Filigrane } from "@/app/(marketing)/produit/Filigrane";
import landing from "../../landing.module.css";
import { ACTIVITES, PAR_SLUG, derive, faqCommune, type Activite } from "../activites.data";
import "./activites.css";

/* Page /activites/<slug> — portée depuis docs/maquette-activites-v1.html.

   Quatre choses à savoir avant d'y toucher :

   1. Une seule route dynamique pour les quatorze activités. Tout ce qui change
      d'une page à l'autre vit dans `../activites.data.ts` ; ce fichier n'est
      que le gabarit. Ajouter une activité = une entrée dans la table, ses
      photos dans public/landing/activites/, et son pictogramme dans
      ActivityIcons.tsx.
   2. La feuille `activites.css` est GLOBALE, pas un module, et tout y est
      préfixé par `.pa` : même raison que produit.css et tarifs.css, le
      vocabulaire de classes vient de la maquette et un module le hacherait.
   3. Le héros est coupé en deux à 50 %. À gauche la photo nette, ce que le
      client achète ; à droite la même photo floutée DANS LE FICHIER (suffixe
      `-flou`) et filigranée, ce qu'il voit avant de payer. Jamais de
      `filter: blur()` en CSS : sur un élément découpé le flou bave aux bords.
   4. Les accords viennent de `derive()`. Le mot de la sortie change d'une
      page à l'autre ("la descente", "le vol", "la palanquée") et commande
      tout le reste. Ne jamais écrire "de la sortie" en dur ici.

   Deux promesses de ces pages ne sont pas encore tenues par le produit, comme
   sur /produit : la synchronisation avec une plateforme de réservation
   (étape 01) et le mode « Vous les offrez ». Assumé pour une landing de
   pré-lancement. */

export function generateStaticParams() {
  return ACTIVITES.map((a) => ({ slug: a.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const a = PAR_SLUG.get(params.slug as Activite["slug"]);
  if (!a) return {};
  const acc = derive(a);
  return {
    title: `Linktrip — ${a.nom} : vendez les photos de ${a.sorties}`,
    description: `La boutique photo pour ${a.metier}. Le soir, vous videz ${a.carte} ; chaque participant reçoit son lien ; ceux qui veulent garder leurs photos paient. Sans abonnement, sans engagement. Essayez sur ${acc.uneSeule}.`,
    alternates: { canonical: `/activites/${a.slug}` },
  };
}

/* ── Pictogrammes de la page, hors jeu d'activités ────────────────────────
   Même grille que ActivityIcons.tsx : 24×24, trait 1.5, currentColor. */
const BASE = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: "false",
} as const;

type IcoProps = SVGProps<SVGSVGElement>;
const Check = (p: IcoProps) => <svg {...BASE} {...p}><path d="m4 12.5 5 5L20 6.5" /></svg>;
const Plus = (p: IcoProps) => <svg {...BASE} {...p}><path d="M12 5v14M5 12h14" /></svg>;
const Chevron = (p: IcoProps) => <svg {...BASE} {...p}><path d="m9 5 7 7-7 7" /></svg>;
const Camera = (p: IcoProps) => (
  <svg {...BASE} {...p}>
    <path d="M3.4 8.6h3.4l1.4-2.3h7.6l1.4 2.3h3.4v10.9H3.4V8.6Z" />
    <circle cx="12" cy="13.9" r="3.4" />
  </svg>
);
const Boutique = (p: IcoProps) => (
  <svg {...BASE} {...p}>
    <path d="M4.6 8.4h14.8l-1.2 10.2a2 2 0 0 1-2 1.8H7.8a2 2 0 0 1-2-1.8L4.6 8.4Z" />
    <path d="M9 10V7.2a3 3 0 0 1 6 0V10" />
  </svg>
);
const Cadeau = (p: IcoProps) => (
  <svg {...BASE} {...p}>
    <rect x="3.8" y="9.6" width="16.4" height="10.4" rx="2" />
    <path d="M2.8 9.6h18.4" />
    <path d="M12 9.6V20" />
    <path d="M12 9.6C10.7 6.9 9.5 5.6 8.1 5.6a2 2 0 0 0 0 4H12Z" />
    <path d="M12 9.6c1.3-2.7 2.5-4 3.9-4a2 2 0 0 1 0 4H12Z" />
  </svg>
);
/* Le cadenas garde son trait à 1.7 : posé sur une photo, 1.5 se perd. */
const Cadenas = (p: IcoProps) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" />
    <path d="M12 14v2.5" />
  </svg>
);

const PHOTOS = "/landing/activites";

/* Les sept tâches de la colonne Linktrip. La première nomme l'unité de
   rangement de l'activité, les six autres sont communes. */
const TACHES = (creneau: string) => [
  `Range les photos par ${creneau}.`,
  "Filigrane l'aperçu tant que la photo n'est pas achetée.",
  "Envoie son lien à chaque participant.",
  "Reçoit le paiement par Stripe et le verse sur votre compte.",
  "Relance ceux qui n'ont pas ouvert leur lien.",
  "Demande l'avis une fois les photos téléchargées.",
  "Supprime les fichiers à la date que vous fixez.",
];

export default function ActivitePage({ params }: { params: { slug: string } }) {
  const a = PAR_SLUG.get(params.slug as Activite["slug"]);
  if (!a) notFound();

  const acc = derive(a);
  const Icone = ACTIVITY_ICONS[a.slug] as ComponentType<SVGProps<SVGSVGElement>>;
  const questions = [...a.faq, ...faqCommune(a, acc)];
  const autres = ACTIVITES.filter((o) => o.slug !== a.slug);

  const etapes: [string, string][] = [
    a.step1,
    a.step2,
    [a.quiRecoit, `Ni compte, ni application. Il voit ${acc.entiere} en aperçu filigrané, sur son téléphone.`],
    ["Vous êtes payé par Stripe", "Comme pour vos réservations. Linktrip ne détient jamais les fonds et ne vous envoie aucune facture à faire."],
  ];

  /* Balisage FAQPage : Google indexe les questions de la section #questions.
     Il suit la même liste que l'accordéon, il ne peut pas s'en écarter. */
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(([q, r]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: r },
    })),
  };

  return (
    <div className={`${landing.page} pa`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      {/* Même neutralisation que sur /produit et /tarifs : `.rail` impose
          min-height:100svh, pensé pour les pages où il encadre le premier écran. */}
      <div className={landing.rail} style={{ flex: "0 0 auto", minHeight: "auto" }}>
        <Header />
      </div>

      <main>
        {/* ═══ 1 · Héros ═══ */}
        <section className="rail" id="top">
          <nav className="crumb" aria-label="Fil d'Ariane">
            <Link href="/#activites">Activités</Link>
            <Chevron />
            <span>{a.nom}</span>
          </nav>

          <div className="hero">
            <div className="card hero__card reveal">
              <p className="hero__badge">
                <Icone />
                <span>{a.nom}</span>
              </p>
              <h1 className="h1" style={{ marginTop: "18px" }}>
                {a.h1a} <span className="grad">{a.h1b}</span>
              </h1>
              <ul className="hero__list">
                <li>
                  <Check className="ico" />
                  <span>
                    <b>Le soir, vous videz {a.carte}.</b> Les photos se rangent par {a.creneau}.
                  </span>
                </li>
                <li>
                  <Check className="ico" />
                  <span>
                    <b>Le lien part sans que vous y pensiez.</b> Le soir même, à chaque participant.
                  </span>
                </li>
                <li>
                  <Check className="ico" />
                  <span>
                    <b>Ceux qui veulent les garder paient.</b> Les paiements arrivent sur votre compte, jamais sur le nôtre.
                  </span>
                </li>
              </ul>
              <div className="hero__cta">
                <EmailCaptureField
                  source={`activite-${a.slug}`}
                  idPrefix={`activite-${a.slug}`}
                  formClassName="field"
                  buttonClassName="btn"
                  submitLabel="Rejoindre"
                />
                <p className="micro">
                  Sans abonnement · Sans engagement<span className="onlyWide"> · Sans matériel</span>
                </p>
              </div>
            </div>

            {/* La coupe dit la protection sans une ligne de texte : à gauche le
                fichier livré, à droite l'aperçu que voit un client qui n'a pas
                encore payé. Le cadenas est posé à cheval sur les deux moitiés. */}
            <div className="hero__panel reveal">
              <img className="hero__photo" src={`${PHOTOS}/${a.photo}.webp`} alt={a.alt} />
              <div className="hero__prot" aria-hidden="true">
                <img className="hero__photo" src={`${PHOTOS}/${a.photo}-flou.webp`} alt="" />
                <Filigrane rows={7} cols={5} />
              </div>
              <span className="hero__seam" aria-hidden="true" />
              <span className="hero__lock" aria-hidden="true"><Cadenas /></span>
              <p className="hero__legend" aria-hidden="true">
                <span>Ce qu&apos;il achète</span>
                <span>Ce qu&apos;il voit d&apos;abord</span>
              </p>
            </div>
          </div>
        </section>

        {/* ═══ 2 · Ce qui se passe aujourd'hui ═══ */}
        <section className="band band--cream" id="scene">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Ce qui se passe aujourd&apos;hui</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>{a.sceneH2}</h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>{a.sceneLead}</p>
            </div>
            <div className="moments">
              {a.moments.map((m) => (
                <article className="card moment reveal" key={m.titre}>
                  <div className="moShot">
                    <img src={`${PHOTOS}/${m.photo}.webp`} alt={m.alt} loading="lazy" />
                  </div>
                  <div className="moment__txt">
                    <p className="moment__h">
                      <em>{m.heure}</em> <strong>{m.titre}</strong>
                    </p>
                    <p className="body">{m.phrase}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 3 · Le parcours ═══ */}
        <section className="band" id="parcours">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Comment ça marche</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>
                Ce qui se passe une fois {a.sortie} {acc.terminee}.
              </h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>
                Quatre étapes. La vôtre dure le temps de brancher {a.carte}.
              </p>
            </div>

            <div className="flow">
              <ol className="steps reveal">
                {etapes.map(([titre, texte], i) => (
                  <li key={titre}>
                    <span className="n">0{i + 1}</span>
                    <div>
                      <strong>{titre}</strong>
                      <p>{texte}</p>
                    </div>
                  </li>
                ))}
              </ol>

              {/* Écran produit : fenêtre blanche à filet, jamais d'ombre. */}
              <div className="win reveal">
                <div className="win__bar">
                  <Logo variant="symbol" height={20} title={null} />
                  <b>Vos sorties</b>
                  <em>{a.ecran}</em>
                </div>
                <div className="win__body">
                  {a.rows.map((r, i) => {
                    const Pastille = ACTIVITY_ICONS[r.ico] as ComponentType<SVGProps<SVGSVGElement>>;
                    const teinte = r.etat === "ok" ? " tagN--ok" : r.etat === "attente" ? " tagN--wait" : "";
                    return (
                      <div className={`row${i === 0 ? " row--on" : ""}`} key={r.titre}>
                        <span className="pill"><Pastille /></span>
                        <span>
                          <b>{r.titre}</b>
                          <small>{r.sous}</small>
                        </span>
                        <span className={`tagN${teinte}`}>{r.tag}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="win__foot">
                  <Check /> Créneaux synchronisés il y a 4 minutes
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 4 · Les deux modes ═══ */}
        <section className="band band--cream" id="modes">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Deux façons de s&apos;en servir</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Vous les vendez, ou vous les offrez.</h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>
                {acc.sortieC} est {acc.meme}, le lien est le même. Seule change la porte au bout.
              </p>
            </div>

            {/* Une seule image, deux issues : la même photo protégée à gauche,
                livrée à droite. C'est l'argument du produit, pas un ornement. */}
            <div className="modes">
              <article className="card mode reveal">
                <div className="modeShot modeShot--prot">
                  <img src={`${PHOTOS}/${a.photo}-flou.webp`} alt="" />
                  <span className="modeVeil" aria-hidden="true" />
                  <Filigrane rows={6} cols={4} />
                  <span className="modeTag modeTag--ink">{a.prix}</span>
                  <span className="modeLock" aria-hidden="true"><Cadenas /></span>
                  <div className="modeName">
                    <span className="modeIco"><Boutique /></span>
                    <h3>Vous les vendez</h3>
                  </div>
                </div>
                <div className="modeTxt">
                  <p className="modeLead">
                    Le participant ouvre son lien, retrouve {acc.entiere} en filigrane, et paie ce qu&apos;il veut garder.
                  </p>
                  <p className="modeDetail">
                    Le prix est le vôtre, à la photo ou au lot. Il paie par carte dans la galerie, sans créer de compte,
                    et récupère les fichiers d&apos;origine dans la foulée.
                  </p>
                  <p className="modeGain">
                    <b>Un revenu sur {a.sorties} que vous photographiez déjà</b>
                    <small>Sans rien changer à votre journée {a.journee}.</small>
                  </p>
                </div>
              </article>

              <article className="card mode reveal">
                <div className="modeShot">
                  <img src={`${PHOTOS}/${a.photo}.webp`} alt={a.alt} />
                  <span className="modeTag">Offert</span>
                  <div className="modeName">
                    <span className="modeIco"><Cadeau /></span>
                    <h3>Vous les offrez</h3>
                  </div>
                </div>
                <div className="modeTxt">
                  <p className="modeLead">
                    Le participant laisse son adresse, accepte le droit à l&apos;image, et repart avec ses photos.
                  </p>
                  <p className="modeDetail">
                    L&apos;avis lui est demandé juste après le téléchargement, quand il vient de revoir {acc.entiere}.
                    Vous gardez une adresse par participant pour la saison suivante.
                  </p>
                  <p className="modeGain">
                    <b>Des avis et des adresses, {acc.nu} après {acc.nu}</b>
                    <small>Sans rien facturer à vos clients.</small>
                  </p>
                </div>
              </article>
            </div>
            <p className="modeNote reveal">
              Le mode se choisit une fois dans vos réglages, et vaut pour {acc.toutes}.
            </p>
          </div>
        </section>

        {/* ═══ 5 · Qui fait quoi ═══ */}
        <section className="band">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Le partage du travail</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Votre part tient en une ligne.</h2>
            </div>

            <div className="card split reveal">
              <div className="split__side split__you">
                <div className="split__head">
                  <Camera className="ico" />
                  <strong>Vous</strong>
                  <em>1 GESTE</em>
                </div>
                <p className="rest">{a.vous}</p>
                <ul>
                  <li>
                    <Check className="ico" />
                    <span>Le soir, vous branchez {a.carte} et vous déposez la journée.</span>
                  </li>
                </ul>
              </div>
              <div className="split__side split__us">
                <div className="split__head">
                  <Logo variant="symbol" height={20} title={null} />
                  <strong>Linktrip</strong>
                  <em>7 TÂCHES</em>
                </div>
                <ul>
                  {TACHES(a.creneau).map((t) => (
                    <li key={t}>
                      <Check className="ico" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ 6 · Questions ═══ */}
        <section className="band band--cream" id="questions">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Vos questions</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Ce que nous demandent {a.metier}.</h2>
            </div>
            <div className="faq reveal">
              {questions.map(([q, r]) => (
                <details key={q}>
                  <summary>
                    {q}
                    <Plus className="ico" />
                  </summary>
                  <p>{r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ 7 · Les autres activités ═══ */}
        <section className="band" id="activites">
          <div className="rail">
            <div className="center">
              <p className="kicker reveal">Linktrip prend en charge</p>
              <h2 className="h2 reveal" style={{ marginTop: "14px" }}>
                Vous faites aussi autre chose que {a.deNom} ?
              </h2>
              <p className="lead reveal" style={{ marginTop: "14px" }}>
                Un seul compte couvre toutes vos activités. Les créneaux se rangent par activité, les liens partent de
                la même galerie.
              </p>
            </div>

            <div className="acts reveal">
              {autres.map((o) => {
                const Pictogramme = ACTIVITY_ICONS[o.slug] as ComponentType<SVGProps<SVGSVGElement>>;
                return (
                  <Link className="act" href={`/activites/${o.slug}`} key={o.slug}>
                    <span className="big"><Pictogramme /></span>
                    <b>{o.nom}</b>
                  </Link>
                );
              })}
            </div>
            <p className="actNote reveal">
              Vous ne trouvez pas votre activité ? <Link href="/liste-attente">Parlons-en.</Link>
            </p>
          </div>
        </section>

        {/* ═══ 8 · CTA final ═══ */}
        <section className="rail" style={{ paddingBottom: "clamp(56px,6vw,96px)" }}>
          <div className="slab final reveal">
            <p className="kicker" style={{ color: "rgba(255,255,255,.5)" }}>Liste d&apos;attente</p>
            <h2 className="h2" style={{ marginTop: "14px" }}>Essayez sur {acc.uneSeule}.</h2>
            <p
              className="lead"
              style={{ marginTop: "14px", color: "rgba(255,255,255,.66)", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}
            >
              Laissez votre adresse. Nous vous prévenons à l&apos;ouverture des comptes, avant la saison.
            </p>
            <EmailCaptureField
              source={`activite-${a.slug}-final`}
              idPrefix={`activite-${a.slug}-final`}
              event="footer_email_submit"
              formClassName="field field--dark"
              buttonClassName="btn"
              submitLabel="Rejoindre"
            />
            <p className="micro" style={{ color: "rgba(255,255,255,.42)" }}>
              Aucune carte bancaire. Aucun engagement.
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <ScrollReveal />
    </div>
  );
}
