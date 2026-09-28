/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Logo } from "@/components/brand/Logo";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";
import landing from "./landing.module.css";
import { AccueilAnime } from "./AccueilAnime";
import "./accueil.css";

/* Accueil — porté depuis docs/maquette-accueil-v6.html (validée le 25/09/2026).

   Trois choses à savoir avant d'y toucher :

   1. `accueil.css` est une feuille GLOBALE préfixée par `.accx`, comme
      `produit.css` (.pp) et `tarifs.css` (.pt) : la page reprend tel quel le
      vocabulaire de classes de la maquette, et la démo du téléphone pilote ces
      classes directement (cf. AccueilAnime). Un module CSS les hacherait.
   2. Tout le balisage est statique et rendu côté serveur ; <AccueilAnime>
      l'anime une fois monté. Les identifiants (#hx, #scr, #fg, #flow, #tr…)
      sont son contrat : ne pas les renommer sans lui.
   3. Les images vivent dans `public/accueil/`, déjà recadrées au format
      d'affichage. Les aperçus du téléphone (`apercu-*`, `email-couverture`)
      sont passés dans le vrai pipeline du filigrane (lib/group-watermark.ts) :
      les régénérer de la même façon si la direction du filigrane change.

   L'en-tête est le <Header> commun ; le pied de page est propre à l'accueil
   (bandeau contact au lieu du champ de liste d'attente). */

export const metadata: Metadata = {
  title: "Linktrip · Vendez à vos clients les photos de leur sortie",
  description:
    "Vous déposez les photos le soir, chaque client reçoit sa galerie privée et paie celles qu'il garde. 20 % par vente, sans abonnement.",
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      "name": "Combien ça coûte ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "L’inscription et l’usage de la plateforme sont gratuits. Linktrip prélève une commission de 20 % sur chaque vente, sans abonnement ni engagement de durée."
      }
    },
    {
      "@type": "Question",
      "name": "Je donne déjà mes photos à mes clients. Pourquoi changer ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vos clients récupèrent leurs photos au même endroit, sans que vous les envoyiez une par une. Ceux qui veulent la haute définition la paient, et chaque vente vous laisse une adresse e-mail et une demande d’avis Google."
      }
    },
    {
      "@type": "Question",
      "name": "Quand est-ce que je touche l’argent ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Les paiements sont encaissés par Stripe sur votre compte, puis virés selon votre calendrier de versement. Linktrip ne détient vos fonds à aucun moment."
      }
    },
    {
      "@type": "Question",
      "name": "Qu’est-ce qu’il me reste à faire après une sortie ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le dépôt des photos. La création de la galerie, l’envoi du lien, les relances et la livraison des fichiers sont automatisés."
      }
    },
    {
      "@type": "Question",
      "name": "Il me faut du matériel ou une appli ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ni l’un ni l’autre. L’appareil photo ou le téléphone que vous utilisez déjà suffit, et la plateforme fonctionne depuis un navigateur."
      }
    },
    {
      "@type": "Question",
      "name": "Comment mes clients récupèrent leurs photos ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ils reçoivent un lien privé par e-mail ou WhatsApp à l’issue de la sortie. Aucun compte n’est requis : ils consultent, sélectionnent, paient et téléchargent."
      }
    },
    {
      "@type": "Question",
      "name": "Qui fixe les prix ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vous. Le prix à l’unité et celui du pack complet se paramètrent dans votre espace et restent modifiables à tout moment."
      }
    },
    {
      "@type": "Question",
      "name": "On peut récupérer les photos sans payer ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Non. Seuls des aperçus floutés et filigranés circulent avant l’achat. Le fichier haute définition n’est délivré qu’après confirmation du paiement."
      }
    },
    {
      "@type": "Question",
      "name": "Et le droit à l’image ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Chaque participant donne son consentement avant de recevoir ses photos et peut en demander la suppression depuis sa galerie, sans intervention de votre part."
      }
    },
    {
      "@type": "Question",
      "name": "Où sont stockées les photos, et combien de temps ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sur des serveurs situés en Europe, conformément au RGPD. Les fichiers sont supprimés automatiquement 90 jours après la sortie."
      }
    },
    {
      "@type": "Question",
      "name": "Ça marche pour les sorties en groupe ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui. Les photos sont classées par créneau et un lien unique couvre la sortie : chaque participant y retrouve les siennes."
      }
    },
    {
      "@type": "Question",
      "name": "Combien je peux gagner ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ils dépendent de votre tarif et de la part de clients qui achètent. Le simulateur en donne une estimation en quelques secondes."
      }
    }
  ],
};

export default function AccueilPage() {
  return (
    <div className={landing.page}>
      {/* Même montage que /produit : .rail porte les gouttières du header, sans
          réclamer les 100svh qu'il impose d'ordinaire au premier écran. */}
      <div className={landing.rail} style={{ flex: "0 0 auto", minHeight: "auto" }}>
        <div className={landing.headerRail}>
          <Header />
        </div>
      </div>

      <div className="accx">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
        />
        <main>
          {/* 1. Ce que c'est → comment ça marche → CTA */}
          <section className="hero">
            <div className="hx" id="hx">
              <div className="hxBg"><img src="/accueil/hero-rafting.webp" alt="Un groupe en rafting lève les pagaies au passage d'un rapide" /></div>
              <div className="hxIn">
                <p className="hxFor rv"><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx={12} cy="12.5" r="3.5" /></svg><span>Pour les moniteurs et les bases de loisirs<span className="hxForMore"> qui prennent des photos pendant leurs sorties</span></span></p>
                <h1 className="rv d1">Vendez à vos clients les photos de leur sortie.</h1>
                <ol className="flow rv d2" id="flow">
                  <li className="on" data-s={0}><span className="nb">1</span><b>Vous déposez les photos de la sortie</b><span className="dt"><em>Le soir, en vidant la carte. Du téléphone ou de l’ordinateur.</em></span><i /></li>
                  <li data-s={1}><span className="nb">2</span><b>Chaque client reçoit sa galerie privée</b><span className="dt"><em>Par e-mail ou WhatsApp. Il n’a pas de compte à créer.</em></span><i /></li>
                  <li data-s={2}><span className="nb">3</span><b>Il achète les photos qu’il veut garder</b><span className="dt"><em>L’argent arrive sur votre compte Stripe.</em></span><i /></li>
                </ol>
                <div className="hxCta rv d3">
                  <Link href="/signup" className="btn btn-white">Créer mon espace<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                  <small>Sans abonnement.</small>
                </div>
              </div>
              <div className="hxDemo rv d2">
                                <div className="phone hxPhone" role="img" aria-label="Démonstration : le pro dépose les photos, le client reçoit sa galerie, choisit deux photos et les paie."><div className="scr" id="scr">
                    <div className="sbar"><span className="num" id="clock">19:02</span><i /><span className="sig"><b /></span></div>
                    {/* A · le pro dépose et publie */}
                    <div className="sc sA on">
                      <div className="nav2"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>Sorties</div>
                      <div className="hd2"><b>Rafting, 10 h</b><span>Sam. 19 sept. · 8 participants</span></div>
                      <div className="gr"><img src="/accueil/depot-1.webp" alt="" /><img src="/accueil/depot-2.webp" alt="" /><img src="/accueil/depot-3.webp" alt="" /><img src="/accueil/depot-4.webp" alt="" /><img src="/accueil/depot-5.webp" alt="" /><img src="/accueil/depot-6.webp" alt="" /><img src="/accueil/depot-7.webp" alt="" /><img src="/accueil/depot-8.webp" alt="" /><img src="/accueil/depot-9.webp" alt="" /><img src="/accueil/depot-10.webp" alt="" /><img src="/accueil/depot-11.webp" alt="" /><img src="/accueil/depot-12.webp" alt="" /><img src="/accueil/depot-13.webp" alt="" /><img src="/accueil/depot-14.webp" alt="" /><img src="/accueil/depot-15.webp" alt="" /><img src="/accueil/depot-16.webp" alt="" /></div>
                      <div className="ft2">
                        <div className="pg"><i /></div>
                        <div className="row2"><span id="cnt">0 photo déposée</span><span className="btn btn-ink" id="pub">Publier</span></div>
                      </div>
                      <div className="toast" id="toast"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Galerie envoyée aux 8 participants</div>
                    </div>
                    {/* B · le client reçoit : notification, puis e-mail */}
                    <div className="sc sB">
                      <div className="lock">
                        <img src="/accueil/fond-ecran.webp" alt="" />
                        <div className="lt"><span>samedi 19 septembre</span><b className="num">19:10</b></div>
                        <div className="notif" id="notif">
                          <span className="ic"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5} width={18} height={14} rx="2.5" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg></span>
                          <div><p className="t"><b>Votre structure</b><time>maintenant</time></p><p className="s">Julie, vos photos du 19 septembre</p><p className="p">14 photos de votre sortie rafting vous attendent.</p></div>
                        </div>
                      </div>
                      <div className="mail" id="mail">
                        <div className="nav2"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>Boîte de réception</div>
                        <div className="mh">
                          <div className="fr"><span className="av">VS</span><div><b>Votre structure</b><span>à Julie · 19:10</span></div></div>
                          <p className="sj">Julie, vos photos du 19 septembre</p>
                        </div>
                        <div className="bd">
                          <img src="/accueil/email-couverture.webp" alt="" />
                          <p>14 photos de votre sortie rafting vous attendent dans votre galerie privée.</p>
                          <span className="btn btn-brand" id="open">Voir mes photos</span>
                        </div>
                      </div>
                    </div>
                    {/* C · il choisit */}
                    <div className="sc sC">
                      <div className="gh">
                        <span className="back"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></span>
                        <div><b>Rafting, 10 h</b><span>14 photos</span></div>
                      </div>
                      <div className="vp"><div className="tr" id="tr">
                          <div className="ph"><img src="/accueil/apercu-1.webp" alt="" /><span className="ck"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></div>
                          <div className="ph"><img src="/accueil/apercu-2.webp" alt="" /><span className="ck"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></div>
                          <div className="ph"><img src="/accueil/apercu-3.webp" alt="" /><span className="ck"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span></div>
                        </div></div>
                      <div className="pos">
                        <div className="dots" id="dots"><i className="on" /><i /><i /><i /><i /><i /></div>
                        <span className="take" id="take"><svg className="ip" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg><svg className="ic2" width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg><em>Prendre</em></span>
                      </div>
                      <div className="pbar"><span className="btn btn-brand" id="buy">Tout prendre · 25&nbsp;€</span></div>
                    </div>
                    {/* D · il paie, reçoit ses photos */}
                    <div className="sc sD">
                      <div className="bgG"><div className="gh"><span className="back" /><div><b>Rafting, 10 h</b><span>14 photos</span></div></div><img src="/accueil/apercu-2.webp" alt="" /></div>
                      <div className="dim" />
                      <div className="sh" id="sheet">
                        <span className="grab" />
                        <div className="sum">
                          <span className="stack"><img src="/accueil/apercu-1.webp" alt="" /><img src="/accueil/apercu-2.webp" alt="" /></span>
                          <div><b>2 photos</b><span>Rafting, 10 h</span></div>
                          <em className="num">8&nbsp;€</em>
                        </div>
                        <div className="fld">
                          <label>Votre e-mail</label>
                          <div className="in">julie.m@gmail.com</div>
                          <small>Vos photos vous sont envoyées à cette adresse dès le paiement.</small>
                        </div>
                        <div className="apay" id="apay"><span className="lbl"><svg width={13} height={15} viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>Pay</span><span className="spin" /></div>
                        <p className="or">ou par carte</p>
                      </div>
                      <div className="ok" id="ok">
                        <span className="ci"><svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                        <b>Vos photos sont à vous</b>
                        <p>En haute définition, sans filigrane. Une copie part aussi sur julie.m@gmail.com.</p>
                        <div className="thumbs"><img src="/accueil/photo-1.webp" alt="" /><img src="/accueil/photo-2.webp" alt="" /></div>
                        <span className="btn btn-ink">Télécharger</span>
                      </div>
                    </div>
                    <span className="fg" id="fg" aria-hidden="true" />
                  </div></div>
                <button type="button" className="pp" id="pp" aria-label="Mettre la démonstration en pause"><svg className="i-pause" width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><rect x={6} y={5} width={4} height={14} rx={1} /><rect x={14} y={5} width={4} height={14} rx={1} /></svg><svg className="i-play" width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg></button>
              </div>
            </div>
          </section>
          {/* Pour quelles activités */}
          <section className="acts" aria-label="Activités">
            <div className="wrap actsHead">
              <p className="rv"><b>Rafting, canyoning, bouée tractée…</b> Si vous sortez l’appareil pendant l’activité, Linktrip vous sert.</p>
              <div className="actsCtl">
                <button type="button" aria-label="Activités précédentes" data-dir={-1}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
                <button type="button" aria-label="Activités suivantes" data-dir={1}><svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
              </div>
            </div>
            <div className="track" id="track"><figure className="card"><img src="/accueil/activite-rafting.webp" alt="Rafting" loading="lazy" /><span>Rafting</span></figure><figure className="card"><img src="/accueil/activite-canyoning.webp" alt="Canyoning" loading="lazy" /><span>Canyoning</span></figure><figure className="card"><img src="/accueil/activite-parapente.webp" alt="Parapente" loading="lazy" /><span>Parapente</span></figure><figure className="card"><img src="/accueil/activite-bouee-tractee.webp" alt="Bouée tractée" loading="lazy" /><span>Bouée tractée</span></figure><figure className="card"><img src="/accueil/activite-parachute-ascensionnel.webp" alt="Parachute ascensionnel" loading="lazy" /><span>Parachute ascensionnel</span></figure><figure className="card"><img src="/accueil/activite-escalade.webp" alt="Escalade" loading="lazy" /><span>Escalade</span></figure><figure className="card"><img src="/accueil/activite-tyrolienne.webp" alt="Tyrolienne" loading="lazy" /><span>Tyrolienne</span></figure><figure className="card"><img src="/accueil/activite-snorkeling.webp" alt="Snorkeling" loading="lazy" /><span>Snorkeling</span></figure><figure className="card"><img src="/accueil/activite-jet-ski.webp" alt="Jet ski" loading="lazy" /><span>Jet ski</span></figure><figure className="card"><img src="/accueil/activite-parcours-aventure.webp" alt="Parcours aventure" loading="lazy" /><span>Parcours aventure</span></figure><figure className="card"><img src="/accueil/activite-balancoire-geante.webp" alt="Balançoire géante" loading="lazy" /><span>Balançoire géante</span></figure><figure className="card"><img src="/accueil/activite-kayak.webp" alt="Kayak" loading="lazy" /><span>Kayak</span></figure><figure className="card"><img src="/accueil/activite-surf.webp" alt="Surf" loading="lazy" /><span>Surf</span></figure><figure className="card"><img src="/accueil/activite-paddle.webp" alt="Paddle" loading="lazy" /><span>Paddle</span></figure></div>
          </section>
          {/* 2. Pourquoi c'est utile */}
          <section className="moment">
            <div className="wrap">
              <div className="collage rv" aria-hidden="true">
                <div className="big"><img src="/accueil/escalade.webp" alt="" /></div>
                <div className="small"><img src="/accueil/raft-jaune.webp" alt="" /></div>
              </div>
              <div className="txt">
                <h2 className="q rv">«&nbsp;Vous avez les photos&nbsp;?&nbsp;»</h2>
                <p className="rv d1">Vos clients vous la posent à chaque fin de sortie. La suite, vous la connaissez&nbsp;:</p>
                <div className="today rv d2">
                  <div><b>WhatsApp</b>vous envoyez les photos une par une, compressées</div>
                  <div><b>WeTransfer</b>il faut y penser le dimanche soir, et le lien expire</div>
                  <div><b>Rien</b>la carte est restée dans le sac</div>
                </div>
                <p className="after rv d3">Linktrip s’occupe de cette suite-là.</p>
              </div>
            </div>
          </section>
          {/* 3. Fonctionnement */}
          <section className="how" id="fonctionnement">
            <div className="wrap">
              <div className="head">
                <h2 className="h2 rv d1">Ce qui se passe après la sortie.</h2>
              </div>
              <div className="steps">
                <article className="step rv">
                  <div className="stage" aria-hidden="true">
                    <div className="pro">
                      <div className="top"><div><b>Canyoning</b><span>Samedi 19 septembre, 14 h</span></div><em>8 participants</em></div>
                      <div className="grid">
                        <img src="/accueil/canyoning-1.webp" alt="" /><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-3.webp" alt="" /><img src="/accueil/canyoning-4.webp" alt="" />
                        <img src="/accueil/canyoning-5.webp" alt="" /><img src="/accueil/canyoning-6.webp" alt="" /><img src="/accueil/canyoning-7.webp" alt="" /><span className="more">+41</span>
                      </div>
                      <div className="drop"><svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Ajouter photos et vidéos</div>
                      <div className="bar">
                        <div className="prog"><i /></div>
                        <div className="row"><span>48 photos déposées</span><span className="btn btn-ink">Publier</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="n">1</span>
                    <h3>Vous déposez toute la carte</h3>
                    <p>Pas besoin de trier ni de renommer. Vous pouvez publier pendant que le transfert continue.</p>
                  </div>
                </article>
                <article className="step rv d1">
                  <div className="stage" aria-hidden="true">
                    <div className="mini"><div className="phone"><div className="scr">
                          <div className="sbar"><span className="num">19:12</span><i /><span className="sig"><b /></span></div>
                          <div className="mhead">
                            <div className="from"><span className="av">VS</span><div className="who"><b>Votre structure</b><span>à Julie</span></div><span className="when">19:12</span></div>
                            <p className="subj">Julie, vos photos du 19 septembre</p>
                          </div>
                          <div className="mbody">
                            <div className="cov"><img src="/accueil/canyoning-3.webp" alt="" /><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-1.webp" alt="" /></div>
                            <p>12 photos de votre sortie canyoning vous attendent.</p>
                            <span className="btn btn-brand">Voir mes photos</span>
                          </div>
                        </div></div></div>
                  </div>
                  <div className="meta">
                    <span className="n">2</span>
                    <h3>Le lien part à votre nom</h3>
                    <p>L’e-mail vient de votre structure, pas de Linktrip. Ceux qui ne l’ont pas ouvert reçoivent un rappel deux heures après.</p>
                  </div>
                </article>
                <article className="step rv d2">
                  <div className="stage" aria-hidden="true">
                    <div className="mini"><div className="phone"><div className="scr">
                          <div className="sbar"><span className="num">19:15</span><i /><span className="sig"><b /></span></div>
                          <div className="sheet">
                            <div className="sum">
                              <span className="stack"><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-3.webp" alt="" /></span>
                              <div><b>Les 12 photos</b><span>Canyoning, 14 h</span></div>
                              <em className="num">25&nbsp;€</em>
                            </div>
                            <div className="fld">
                              <label>Votre e-mail</label>
                              <div className="in">julie.m@gmail.com</div>
                              <small>Vos photos vous sont envoyées à cette adresse dès le paiement.</small>
                            </div>
                            <div className="apay"><svg width={13} height={15} viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>Pay</div>
                            <p className="or">ou par carte</p>
                          </div>
                        </div></div></div>
                  </div>
                  <div className="meta">
                    <span className="n">3</span>
                    <h3>Il paie celles qu’il garde</h3>
                    <p>Tant qu’elles ne sont pas payées, les photos restent filigranées. Après l’achat, nous demandons à votre client un avis Google.</p>
                  </div>
                </article>
              </div>
              <p className="stepsHint" aria-hidden="true">Faites glisser pour voir les trois étapes<svg width={18} height={12} viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h19M15 1l5 5-5 5" /></svg></p>
            </div>
          </section>
          {/* 4. Ce que ça coûte */}
          <section className="price" id="tarif">
            <div className="wrap">
              <div className="slab rv">
                <div>
                  <h2 className="h2">Vous payez uniquement quand vous vendez.</h2>
                  <p className="lede tl">Aucun abonnement, aucun frais d’inscription.</p>
                </div>
                <div>
                  <p className="rate"><b>20&nbsp;%</b><span>uniquement sur les photos vendues</span></p>
                  <div className="ex">
                    <p className="case">Exemple : un client achète un lot de 12 photos à 25&nbsp;€.</p>
                    <div className="split">
                      <div><span className="v">25&nbsp;€</span><span className="l">payés par <br />le client</span></div>
                      <span className="ar">→</span>
                      <div className="cut"><span className="v">5&nbsp;€</span><span className="l">commission <br />Linktrip</span></div>
                      <span className="ar">→</span>
                      <div className="mine"><span className="v">20&nbsp;€</span><span className="l">reçus par vous</span></div>
                    </div>
                    <div className="sbar8" aria-hidden="true"><i /><i /></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* 5. Objections */}
          <section className="fq" id="questions" aria-labelledby="faq">
            <div className="fqWrap">
              <div className="fqAside">
                <h2 id="faq" className="fqH2 rv d1">Les questions que les moniteurs nous posent.</h2>
              </div>
              <div className="rv d2">
                <details className="fqQa" name="faq-accueil" open><summary className="fqSum">Combien ça coûte ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">L’inscription et l’usage de la plateforme sont gratuits. Linktrip prélève une commission de 20 % sur chaque vente, sans abonnement ni engagement de durée.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Je donne déjà mes photos à mes clients. Pourquoi changer ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Vos clients récupèrent leurs photos au même endroit, sans que vous les envoyiez une par une. Ceux qui veulent la haute définition la paient, et chaque vente vous laisse une adresse e-mail et une demande d’avis Google.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Quand est-ce que je touche l’argent ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Les paiements sont encaissés par Stripe sur votre compte, puis virés selon votre calendrier de versement. Linktrip ne détient vos fonds à aucun moment.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Qu’est-ce qu’il me reste à faire après une sortie ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Le dépôt des photos. La création de la galerie, l’envoi du lien, les relances et la livraison des fichiers sont automatisés.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Il me faut du matériel ou une appli ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Ni l’un ni l’autre. L’appareil photo ou le téléphone que vous utilisez déjà suffit, et la plateforme fonctionne depuis un navigateur.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Comment mes clients récupèrent leurs photos ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Ils reçoivent un lien privé par e-mail ou WhatsApp à l’issue de la sortie. Aucun compte n’est requis : ils consultent, sélectionnent, paient et téléchargent.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Qui fixe les prix ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Vous. Le prix à l’unité et celui du pack complet se paramètrent dans votre espace et restent modifiables à tout moment.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">On peut récupérer les photos sans payer ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Non. Seuls des aperçus floutés et filigranés circulent avant l’achat. Le fichier haute définition n’est délivré qu’après confirmation du paiement.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Et le droit à l’image ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Chaque participant donne son consentement avant de recevoir ses photos et peut en demander la suppression depuis sa galerie, sans intervention de votre part.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Où sont stockées les photos, et combien de temps ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Sur des serveurs situés en Europe, conformément au RGPD. Les fichiers sont supprimés automatiquement 90 jours après la sortie.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Ça marche pour les sorties en groupe ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Oui. Les photos sont classées par créneau et un lien unique couvre la sortie : chaque participant y retrouve les siennes.</p></details>
                <details className="fqQa" name="faq-accueil"><summary className="fqSum">Combien je peux gagner ?<span className="fqSign" aria-hidden="true" /></summary><p className="fqAns">Ils dépendent de votre tarif et de la part de clients qui achètent. <Link href="/produit#simulateur">Le simulateur</Link> en donne une estimation en quelques secondes.</p></details>
              </div>
            </div>
          </section>
          {/* 6. Passer à l'action */}
          <section className="end">
            <div className="wrap">
              <div className="endCard rv">
                <img src="/accueil/ski-nautique.webp" alt="" />
                <div className="endIn">
                  <h2 className="h2">Essayez‑le sur votre prochaine sortie.</h2>
                  <p>L’inscription est gratuite. Il vous faudra un compte Stripe pour recevoir les paiements.</p>
                  <Link href="/signup" className="btn btn-white">Créer mon espace<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="ftr">
          <div className="ftrMark" aria-hidden="true"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M57.5 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42.5" fill="none" stroke="#fff" strokeWidth={8.5} strokeLinecap="round" /><circle cx={73} cy={27} r={11} fill="#fff" /></svg></div>
          <div className="ftrIn">
            <div className="ftrBand">
              <div>
                <h3>Une question avant de vous lancer&nbsp;?</h3>
                <p>Vous écrivez directement à ceux qui font Linktrip.</p>
              </div>
              <a href="mailto:hello@linktrip.co" className="btn btn-white">hello@linktrip.co</a>
            </div>
            <div className="ftrGrid">
              <div><Link href="/" className="ftrLogo" aria-label="Linktrip, accueil"><Logo variant="lockup" tone="white" height={26} title={null} /></Link><div className="trust" style={{marginTop: 16}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.8 4.8 5.6v6.1c0 4.4 3 8 7.2 9.5 4.2-1.5 7.2-5.1 7.2-9.5V5.6L12 2.8Z" /><path d="m8.9 12.1 2.1 2.1 4.1-4.2" /></svg>Hébergé en Europe, conforme RGPD</div></div>
              <div><h4>Produit</h4><div className="ftrCol"><Link href="/produit">Le produit</Link><Link href="/produit#demo">Voir la démo</Link><Link href="/produit#simulateur">Simuler mes revenus</Link><Link href="/#tarif">Tarif</Link><Link href="/liste-attente">Liste d’attente</Link><Link href="/connexion">Connexion opérateur</Link></div></div>
              <div><h4>Activités</h4><div className="ftrCol"><Link href="/activites/surf" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2.6c4.6 3.4 6.6 8.6 4.4 13-1.4 2.8-3.2 4.4-4.4 5.4-1.2-1-3-2.6-4.4-5.4-2.2-4.4-.2-9.6 4.4-13Z" /> <path d="M12 6.6v11" /></svg>Surf</Link><Link href="/activites/parapente" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.2 10.4a8.8 8.8 0 0 1 17.6 0" /> <path d="M3.2 10.4c2.9 0 4.4 1.6 4.4 1.6M20.8 10.4c-2.9 0-4.4 1.6-4.4 1.6M12 10.4v1.6" /> <path d="m4.6 11.2 6.6 4.6M19.4 11.2l-6.6 4.6" /> <circle cx={12} cy={17} r="1.4" /> <path d="M2.5 21c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg>Parapente</Link><Link href="/activites/canyoning" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 3v10.5" /> <path d="M20 3v10.5" /> <path d="M12 3.5v7" /> <path d="M12 10.5c0 2.2 1.4 2.6 1.4 4.4" /> <path d="M10.4 3.5a1.6 1.6 0 1 1 3.2 0" /> <path d="M4 13.5h3M17 13.5h3" /> <path d="M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg>Canyoning</Link><Link href="/activites/rafting" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2.4 12.6h19.2l-2.3 4.6H4.7L2.4 12.6Z" /> <path d="M8.6 12.6 15 4.4" /> <path d="m13.6 3.1 2.9 2.2-1.7 2.3-2.9-2.2 1.7-2.3Z" /> <path d="M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg>Rafting</Link><Link href="/activites/plongee" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8.6 8.2a3.2 3.2 0 0 1 6.4 0v1.4H8.6V8.2Z" /> <path d="M8.6 9.6c-1.4.8-2.2 2.2-2.2 3.8v5.8h11.2v-5.8c0-1.6-.8-3-2.2-3.8" /> <path d="M11.8 4.6V3M15.6 5.4l1-1.2M8 5.4 7 4.2" /> <path d="M9.8 13.4h4.4" /></svg>Plongée</Link><Link href="/activites/parc-aventure" className="act"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.4 4.6v15" /> <path d="M19.6 4.6v15" /> <path d="M4.4 8.6c3.6 2.4 7.6 2.4 11.2 0" /> <path d="M8.8 12.6c3.6 2.4 7.2 2.4 10.8 0" /> <path d="M2.6 19.6h18.8" /> <path d="M13.2 8.6v1.6M9.6 12.6v1.6" /></svg>Parc aventure</Link></div></div>
              <div><h4>Ressources</h4><div className="ftrCol"><a href="#questions">Questions fréquentes</a><a href="mailto:hello@linktrip.co">Nous écrire</a><Link href="/mentions-legales">Mentions légales</Link><Link href="/cgu">CGU</Link><Link href="/cgv">CGV</Link><Link href="/confidentialite">Confidentialité</Link><ManageCookiesLink /></div></div>
            </div>
            <div className="ftrBot">
              <span>© 2026 Linktrip · Fait en France</span>
              <div className="soc">
                <a href="https://instagram.com/linktrip.co" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><svg viewBox="0 0 24 24" width={15} height={15} stroke="rgba(255,255,255,.7)" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx="5.4" /><circle cx={12} cy={12} r="4.2" /><circle cx="17.4" cy="6.6" r="1.1" fill="rgba(255,255,255,.7)" stroke="none" /></svg></a>
                <a href="https://linkedin.com/company/linktrip" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"><svg viewBox="0 0 24 24" width={15} height={15} stroke="rgba(255,255,255,.7)" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={3} width={18} height={18} rx={4} /><path d="M8 10.5v6.2M8 7.4v.1M12 16.7v-3.6a2.2 2.2 0 0 1 4.4 0v3.6" /></svg></a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <AccueilAnime />
    </div>
  );
}
