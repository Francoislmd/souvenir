/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Logo } from "@/components/brand/Logo";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";
import { parMilieu } from "@/components/marketing/activitesNav";
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

const TITLE = "Linktrip · Vendez à vos clients les photos de leur sortie";
const DESCRIPTION =
  "Le soir, vous déposez les photos. Chaque client reçoit les siennes à votre nom et paie celles qu’il garde.";

/* Les balises de partage sont redonnées ici : sans elles, l'accueil hérite
   de celles du layout racine, et c'est ce qu'affichent WhatsApp, LinkedIn ou
   un mail de prospection quand on colle le lien. */
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "Linktrip", locale: "fr_FR", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

/* Les questions de la FAQ, écrites une seule fois : le balisage et le JSON-LD
   lisent ce tableau. Sept questions au plus, dans les mots d'un moniteur ; le
   prix et les gains ont leur bloc (#tarif), ils ne reviennent pas ici.
   Chaque réponse s'appuie sur ce que fait le code (relu le 03/10/2026) :
   - liens : lib/private-link.ts, seule une adresse de la liste reçoit le sien ;
   - aperçus : lib/group-watermark.ts, flou léger + nom du pro en diagonale ;
   - effacement : lib/gdpr.ts, 90 jours après la publication ;
   - plafond : accessFromOrders, un achat à l'unité ne dépasse jamais le pack. */
const FAQ: { q: string; a: string }[] = [
  {
    q: "Je donne déjà mes photos à mes clients. Pourquoi changer ?",
    a: "Vous n’envoyez plus rien vous-même : chaque client reçoit son lien et récupère ses photos seul. Ceux qui veulent les photos en haute définition les paient. Vous ne faites plus rien à la main.",
  },
  {
    q: "Qu’est-ce qu’il me reste à faire après une sortie ?",
    a: "Déposer les photos et coller la liste du groupe, créneau par créneau si vous en avez plusieurs. L’envoi des liens, les rappels, le paiement et la livraison se font sans vous. Pas d’appli à installer : votre appareil habituel et un navigateur suffisent.",
  },
  {
    q: "Je n’ai pas les e-mails de mes clients ?",
    a: "Collez la liste de votre réservation telle quelle : Linktrip y retrouve les e-mails et les numéros de téléphone. Un client sans e-mail reçoit son lien par SMS. Un client absent de la liste ne reçoit rien.",
  },
  {
    q: "Quand est-ce que je touche l’argent ?",
    a: "Le client paie sur votre compte Stripe, qui vous vire l’argent sur votre compte bancaire. Linktrip ne touche jamais vos fonds : seule sa commission est prélevée au passage.",
  },
  {
    q: "Qui fixe les prix ?",
    a: "Vous. Vous choisissez le prix d’une photo et celui du pack, et vous les changez quand vous voulez. Un client qui achète photo par photo ne paie jamais plus que le pack.",
  },
  {
    q: "On peut récupérer les photos sans payer ?",
    a: "Non. Avant l’achat, le client voit ses photos légèrement floutées, avec le nom de votre structure en filigrane. Le fichier en haute définition ne part qu’une fois le paiement confirmé.",
  },
  {
    q: "Et le droit à l’image ?",
    a: "Les photos ne sont jamais publiques : il faut le lien personnel envoyé au client pour les voir, et elles n’apparaissent pas sur Google. Le client peut retirer une photo de sa galerie sans se justifier. Tout est hébergé en Europe et effacé 90 jours après la mise en ligne.",
  },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

/* La ligne d'activités sous le héros reprend exactement le menu du header
   (activitesNav.ts) : un seul ordre, une seule orthographe sur tout le site. */
const ACTIVITES_ACCUEIL = parMilieu("eau").concat(parMilieu("air"), parMilieu("terre"));

/* Exemple de prix, une seule source pour le bloc #tarif. Frais Stripe d'une
   carte européenne standard (1,5 % + 0,25 €, grille publique de Stripe France,
   relue le 03/10/2026) : en charge directe ils sont à la charge du pro
   (lib/checkout.ts), ils doivent donc apparaître dans ce qu'il touche. */
const PACK_CENTS = 2500;
const COMMISSION_CENTS = Math.round(PACK_CENTS * 0.2);
const STRIPE_CENTS = Math.round(PACK_CENTS * 0.015 + 25);
const NET_CENTS = PACK_CENTS - COMMISSION_CENTS - STRIPE_CENTS;
const eur = (cents: number, decimals = cents % 100 !== 0) =>
  `${(cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: decimals ? 2 : 0, maximumFractionDigits: decimals ? 2 : 0 })}\u00a0€`;

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
                <p className="hxFor rv"><svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.4-2h6.2l1.4 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" /><circle cx={12} cy="12.5" r="3.5" /></svg>Pour les moniteurs et structures outdoor</p>
                <h1 className="rv d1">Vendez à vos clients les photos de leur sortie.</h1>
                <p className="hxLede rv d2">Le soir, vous déposez la carte. Chaque client reçoit ses photos à votre nom et paie seulement celles qu’il veut garder.</p>
                {/* Légende du téléphone, synchronisée par AccueilAnime. Affichée
                    sous la démo en mobile seulement : sur desktop le chapeau
                    ci-dessus dit la même chose en une phrase (03/10/2026). */}
                <ol className="flow" id="flow">
                  <li className="on" data-s={0}><span className="nb">1</span><b>Vous déposez les photos de la sortie</b><span className="dt"><em>Le soir, en vidant la carte. Du téléphone ou de l’ordinateur.</em></span><i /></li>
                  <li data-s={1}><span className="nb">2</span><b>Chaque client reçoit sa galerie privée</b><span className="dt"><em>Par e-mail ou WhatsApp, à votre nom. Sans compte à créer.</em></span><i /></li>
                  <li data-s={2}><span className="nb">3</span><b>Il achète les photos qu’il veut garder</b><span className="dt"><em>Il paie sur votre compte Stripe, pas sur le nôtre.</em></span><i /></li>
                </ol>
                <div className="hxCta rv d3">
                  <Link href="/signup" className="btn btn-white">Créer mon espace<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                  <Link href="/produit#demo" className="hxDemoLink"><span className="pl" aria-hidden="true"><svg width={10} height={10} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></svg></span>Voir la démo</Link>
                  <small>Sans abonnement.</small>
                </div>
              </div>
              <div className="hxDemo rv d2">
                                <div className="phone hxPhone" role="img" aria-label="Démonstration : le pro dépose les photos, le client reçoit sa galerie, choisit deux photos et les paie."><div className="scr" id="scr">
                    <div className="sbar"><span className="num" id="clock">19:02</span><i /><span className="sig"><b /></span></div>
                    {/* A · le pro dépose et publie */}
                    <div className="sc sA on">
                      <div className="hd2"><b>Rafting, 10 h</b><span>Samedi 19 septembre</span></div>
                      <div className="gr"><img src="/accueil/depot-1.webp" alt="" /><img src="/accueil/depot-2.webp" alt="" /><img src="/accueil/depot-3.webp" alt="" /><img src="/accueil/depot-4.webp" alt="" /><img src="/accueil/depot-5.webp" alt="" /><img src="/accueil/depot-6.webp" alt="" /><img src="/accueil/depot-7.webp" alt="" /><img src="/accueil/depot-8.webp" alt="" /><img src="/accueil/depot-9.webp" alt="" /><img src="/accueil/depot-10.webp" alt="" /><img src="/accueil/depot-11.webp" alt="" /><img src="/accueil/depot-12.webp" alt="" /><img src="/accueil/depot-13.webp" alt="" /><img src="/accueil/depot-14.webp" alt="" /><img src="/accueil/depot-15.webp" alt="" /><img src="/accueil/depot-16.webp" alt="" /></div>
                      <div className="ft2">
                        <div className="row2"><span id="cnt"><b>0</b> photo</span><span className="btn btn-ink" id="pub">Publier</span></div>
                      </div>
                      <div className="toast" id="toast"><svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Envoyée aux 8 participants</div>
                    </div>
                    {/* B · le client reçoit : notification, puis e-mail */}
                    <div className="sc sB">
                      <div className="lock">
                        <img src="/accueil/fond-ecran.webp" alt="" />
                        <div className="lt"><span>samedi 19 septembre</span><b className="num">19:10</b></div>
                        <div className="notif" id="notif">
                          <span className="ic"><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5} width={18} height={14} rx="2.5" /><path d="M3.5 6.5 12 13l8.5-6.5" /></svg></span>
                          <div><p className="t"><b>Bleu Torrent</b><time>maintenant</time></p><p className="s">Julie, vos photos du 19 septembre</p><p className="p">14 photos de votre sortie rafting vous attendent.</p></div>
                        </div>
                      </div>
                      <div className="mail" id="mail">
                        <div className="mh">
                          <div className="fr"><span className="av"><svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><circle cx={16} cy={16} r={16} fill="#0e4a7b" /><path d="M7.5 18.5 12.6 11.5l3.1 4.1 2.3-2.9 6.5 5.8" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /><path d="M8 22.6c1.4-1.1 2.9-1.1 4.3 0s2.9 1.1 4.3 0 2.9-1.1 4.3 0 2.2.9 2.9.6" fill="none" stroke="#7fd0ff" strokeWidth={1.9} strokeLinecap="round" /></svg></span><div><b>Bleu Torrent</b></div></div>
                          <p className="sj">Julie, vos photos du 19 septembre</p>
                        </div>
                        <div className="bd">
                          <img src="/accueil/email-couverture.webp" alt="" />
                          <p>14 photos de votre sortie rafting vous attendent.</p>
                          <span className="btn btn-brand" id="open">Voir mes photos</span>
                        </div>
                      </div>
                    </div>
                    {/* C · il choisit */}
                    <div className="sc sC">
                      <div className="gh">
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
                      <div className="bgG"><div className="gh"><div><b>Rafting, 10 h</b><span>14 photos</span></div></div><img src="/accueil/apercu-2.webp" alt="" /></div>
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
                        </div>
                        <div className="apay" id="apay"><span className="lbl"><svg width={13} height={15} viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>Pay</span><span className="spin" /></div>
                        <div className="cardPay"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5.5} width={18} height={13} rx={2.2} /><path d="M3 10h18M7 15h3" /></svg>Payer par carte</div>
                      </div>
                      <div className="ok" id="ok">
                        <span className="ci"><svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
                        <b>Vos photos sont à vous</b>
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
          {/* Pour quelles activités : une ligne de noms sous le héros, à la place
              du carrousel de photos (03/10/2026). Mêmes noms que le menu. */}
          <nav className="acts" aria-label="Activités">
            <div className="wrap">
              {ACTIVITES_ACCUEIL.map(({ slug, nom }) => (
                <Link key={slug} href={`/activites/${slug}`}>{nom}</Link>
              ))}
            </div>
          </nav>
          {/* 2. Pourquoi c'est utile */}
          <section className="moment">
            <div className="wrap">
              <h2 className="h2 q">«&nbsp;Vous avez les photos&nbsp;?&nbsp;»</h2>
              <p>Tous vos groupes vous la posent. Aujourd’hui, les photos finissent dans un groupe WhatsApp, un WeTransfer du dimanche soir, ou sur la carte SD.</p>
            </div>
          </section>
          {/* 3. Fonctionnement */}
          <section className="how" id="fonctionnement">
            <div className="wrap">
              <div className="head">
                <h2 className="h2">Ce qui se passe après la sortie.</h2>
              </div>
              <div className="steps">
                <article className="step rv">
                  <div className="stage" aria-hidden="true">
                    <img className="stageBg" src="/accueil/fond-etape-1.webp" alt="" />
                    <div className="stageIn">
                    <div className="mini"><div className="phone"><div className="scr">
                    <div className="sbar"><span className="num">19:02</span><i /><span className="sig"><b /></span></div>
                    <div className="pro">
                      <div className="top"><div><b>Canyoning, 14 h</b><span>Samedi 19 septembre</span></div></div>
                      <div className="grid">
                        <img src="/accueil/canyoning-1.webp" alt="" /><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-3.webp" alt="" /><img src="/accueil/canyoning-4.webp" alt="" />
                        <img src="/accueil/canyoning-5.webp" alt="" /><img src="/accueil/canyoning-6.webp" alt="" /><img src="/accueil/canyoning-7.webp" alt="" /><span className="more">+41</span>
                      </div>
                      <div className="bar">
                        <div className="row"><span><b className="num">48</b> photos</span><span className="btn btn-ink">Publier</span></div>
                      </div>
                    </div>
                    </div></div></div>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="n">Étape 1</span>
                    <h3>Vous déposez toute la carte</h3>
                    <p>Sans trier ni renommer. Vous publiez pendant que l’envoi continue.</p>
                  </div>
                </article>
                <article className="step rv d1">
                  <div className="stage" aria-hidden="true">
                    <img className="stageBg" src="/accueil/fond-etape-2.webp" alt="" />
                    <div className="stageIn">
                    <div className="mini"><div className="phone"><div className="scr">
                          <div className="sbar"><span className="num">19:12</span><i /><span className="sig"><b /></span></div>
                          <div className="mhead">
                            <div className="from"><span className="av"><svg viewBox="0 0 32 32" width="100%" height="100%" aria-hidden="true"><circle cx={16} cy={16} r={16} fill="#0e4a7b" /><path d="M7.5 18.5 12.6 11.5l3.1 4.1 2.3-2.9 6.5 5.8" fill="none" stroke="#fff" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" /><path d="M8 22.6c1.4-1.1 2.9-1.1 4.3 0s2.9 1.1 4.3 0 2.9-1.1 4.3 0 2.2.9 2.9.6" fill="none" stroke="#7fd0ff" strokeWidth={1.9} strokeLinecap="round" /></svg></span><div className="who"><b>Bleu Torrent</b></div></div>
                            <p className="subj">Julie, vos photos du 19 septembre</p>
                          </div>
                          <div className="mbody">
                            <div className="cov"><img src="/accueil/canyoning-3.webp" alt="" /><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-1.webp" alt="" /></div>
                            <p>12 photos de votre sortie canyoning vous attendent.</p>
                            <span className="btn btn-brand">Voir mes photos</span>
                          </div>
                        </div></div></div>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="n">Étape 2</span>
                    <h3>Le lien part à votre nom</h3>
                    <p>L’e-mail porte le nom de votre structure, pas celui de Linktrip. S’il n’achète pas, il reçoit un rappel deux jours après, puis un dernier.</p>
                  </div>
                </article>
                <article className="step rv d2">
                  <div className="stage" aria-hidden="true">
                    <img className="stageBg" src="/accueil/fond-etape-3.webp" alt="" />
                    <div className="stageIn">
                    <div className="mini"><div className="phone"><div className="scr">
                          <div className="sbar"><span className="num">19:15</span><i /><span className="sig"><b /></span></div>
                          <div className="sheet">
                            <div className="sum">
                              <span className="stack"><img src="/accueil/canyoning-2.webp" alt="" /><img src="/accueil/canyoning-3.webp" alt="" /></span>
                              <div><b>Le pack, 12 photos</b><span>Canyoning, 14 h</span></div>
                              <em className="num">25&nbsp;€</em>
                            </div>
                            <div className="fld">
                              <label>Votre e-mail</label>
                              <div className="in">julie.m@gmail.com</div>
                            </div>
                            <div className="apay"><svg width={13} height={15} viewBox="0 0 17 20" fill="currentColor"><path d="M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z" /></svg>Pay</div>
                            <div className="cardPay"><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x={3} y={5.5} width={18} height={13} rx={2.2} /><path d="M3 10h18M7 15h3" /></svg>Payer par carte</div>
                          </div>
                        </div></div></div>
                    </div>
                  </div>
                  <div className="meta">
                    <span className="n">Étape 3</span>
                    <h3>Il paie depuis son téléphone</h3>
                    <p>Par carte, Apple Pay ou Google Pay, sans créer de compte. Les fichiers en haute définition arrivent aussitôt dans sa boîte mail.</p>
                  </div>
                </article>
              </div>
              <p className="stepsHint" aria-hidden="true">Faites glisser pour voir les trois étapes<svg width={18} height={12} viewBox="0 0 22 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 6h19M15 1l5 5-5 5" /></svg></p>
            </div>
          </section>
          {/* 4. Ce que ça coûte, puis ce que ça rapporte */}
          <section className="price" id="tarif">
            <div className="wrap">
              <div className="slab">
                <h2 className="h2">Vous payez uniquement quand vous vendez.</h2>
                <div>
                  <p className="lbl">Sur un pack à {eur(PACK_CENTS)}, vous recevez</p>
                  <p className="net num">{eur(NET_CENTS)}</p>
                  <p className="det">{eur(COMMISSION_CENTS)} de commission pour Linktrip (20&nbsp;%) et {eur(STRIPE_CENTS)} de frais Stripe, pour une carte européenne. Pas d’abonnement.</p>
                  <Link href="/produit#simulateur" className="calc">Calculer avec vos chiffres<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                </div>
              </div>
            </div>
          </section>
          {/* 5. Objections */}
          <section className="fq" id="questions" aria-labelledby="faq">
            <div className="wrap fqWrap">
              <div className="fqAside">
                <h2 id="faq" className="h2">Questions fréquentes</h2>
              </div>
              <div>
                {FAQ.map(({ q, a }, i) => (
                  <details key={q} className="fqQa" name="faq-accueil" open={i === 0}>
                    <summary className="fqSum">{q}<span className="fqSign" aria-hidden="true" /></summary>
                    <p className="fqAns">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
          {/* 6. Passer à l'action */}
          <section className="end">
            <div className="wrap">
              <div className="endCard">
                <img src="/accueil/fin-parapente.webp" alt="Un moniteur de parapente prend la photo de son passager en plein vol" />
                <div className="endIn">
                  <h2 className="h2">Essayez Linktrip sur votre prochaine sortie.</h2>
                  <p>Pas de compte Stripe&nbsp;? Il se crée pendant l’inscription.</p>
                  <Link href="/signup" className="btn btn-white">Créer mon espace<svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
                  <p className="who">Une question avant de vous lancer&nbsp;? François, qui a créé Linktrip, vous répond&nbsp;: <a href="mailto:hello@linktrip.co">hello@linktrip.co</a></p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="ftr">
          <div className="ftrIn">
            <div className="ftrGrid">
              <div><Link href="/" className="ftrLogo" aria-label="Linktrip, accueil"><Logo variant="lockup" tone="white" height={26} title={null} /></Link></div>
              <div><h4>Produit</h4><div className="ftrCol"><Link href="/produit">Comment ça marche</Link><Link href="/produit#demo">Voir la démo</Link><Link href="/produit#simulateur">Simuler mes revenus</Link><Link href="/#tarif">Prix</Link><Link href="/connexion">Se connecter</Link></div></div>
              <div><h4>Activités</h4><div className="ftrCol"><Link href="/activites/surf">Surf</Link><Link href="/activites/parapente">Parapente</Link><Link href="/activites/canyoning">Canyoning</Link><Link href="/activites/rafting">Rafting</Link><Link href="/activites/plongee">Plongée</Link><Link href="/activites/parc-aventure">Parc aventure</Link></div></div>
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
