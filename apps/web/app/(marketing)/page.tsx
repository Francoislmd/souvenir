/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";
import { LogoOcean } from "@/components/marketing/landing-v2/LogoOcean";
import { ACTIVITIES } from "@/components/marketing/landing-v2/landing-data";
import { AccueilHeader, Arrow } from "@/components/marketing/accueil/AccueilHeader";
import { CheckCircle, Locked } from "@/components/marketing/accueil/Locked";
import { Simulator } from "@/components/marketing/accueil/Simulator";
import { Solution } from "@/components/marketing/accueil/Solution";
import { Steps } from "@/components/marketing/accueil/Steps";
import { Reveal } from "@/components/marketing/accueil/Reveal";
import s from "./accueil.module.css";

/* Accueil façon Payfit, refonte du 24/10/2026 : portée depuis le canvas
   Claude Design « Landing façon Payfit, design system » (design system Corail depuis le 25/10/2026).
   L'accueil précédent (landing-v2.module.css, commit 5f26a7c) reste dans
   l'historique git ; ses composants LogoOcean et landing-data sont réutilisés. */

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--lt-font" });

const TITLE = "Linktrip · Monétisez vos photos, automatisez vos ventes";
const DESCRIPTION =
  "Chaque client reçoit sa galerie privée et paie les photos qu’il garde. Le paiement arrive sur votre compte, sans abonnement.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "Linktrip", locale: "fr_FR", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const FAQ: { q: string; a: string }[] = [
  { q: "Faut-il du matériel particulier ?", a: "Non, votre appareil photo ou votre téléphone suffit." },
  { q: "Combien coûte Linktrip ?", a: "Aucun abonnement : Linktrip prend une commission de 20 % sur chaque vente." },
  { q: "Y a-t-il des frais en plus ?", a: "Seulement les frais de paiement Stripe : 1,5 % + 0,25 € par paiement." },
  { q: "Quand suis-je payé ?", a: "Le client paie sur votre compte Stripe, qui vire l’argent sur votre compte bancaire." },
  { q: "Mes clients peuvent-ils récupérer les photos sans payer ?", a: "Non, les photos sont filigranées avant l’achat." },
  { q: "Et le droit à l’image ?", a: "Chaque client peut retirer une photo depuis sa galerie, sans justification." },
  { q: "Combien de temps les photos restent-elles en ligne ?", a: "90 jours après la publication." },
  { q: "Puis-je arrêter à tout moment ?", a: "Oui, il n’y a aucun engagement." },
];

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const M = (n: string) => `/landing-payfit/${n}.webp`;
const LEA = ["m-snorkeling", "m-parapente", "m-surf", "m-plongee", "m-balancoire", "m-jet-ski"].map(M);

/** Polaroïds du bloc final : [image, côté, x, y, largeur, rotation, groupe]. */
const POLAROIDS: [string, "left" | "right", string, number, number, number, string][] = [
  ["m-snorkeling", "left", "2%", 58, 170, -6, s.polCorner],
  ["r-3", "left", "9.5%", 318, 160, 5, s.polSide],
  ["r-1", "left", "22%", -34, 150, 4, s.polInner],
  ["m-plongee", "left", "39%", -78, 136, -4, s.polTop],
  ["m-balancoire", "right", "39%", -70, 136, 5, s.polTop],
  ["m-surf", "right", "22%", -30, 150, -4, s.polInner],
  ["m-jet-ski", "right", "2%", 62, 170, 5, s.polCorner],
  ["r-4", "right", "9.5%", 322, 160, -5, s.polSide],
];

function Doodle({ children }: { children: React.ReactNode }) {
  return (
    <svg className={s.doodle} width="44" height="44" viewBox="0 0 48 48" fill="none" stroke="#2A1022" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <span className={s.pointIcon} aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

function ActivityChip({ a }: { a: (typeof ACTIVITIES)[number] }) {
  return (
    <>
      <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" stroke="currentColor" strokeLinecap="round" aria-hidden="true">
        {a.parts.map((p, i) => (
          <path key={i} d={p.d} transform={p.t || undefined} strokeWidth={p.sw} />
        ))}
      </svg>
      {a.name}
    </>
  );
}

export default function HomePage() {
  const year = new Date().getFullYear();

  return (
    <div className={`${inter.variable} ${s.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <AccueilHeader />
      <Reveal />

      <main>
        {/* 1. Hero : texte sur grille à gauche, vidéo et téléphone à droite */}
        <div className={s.top}>
          <section className={s.hero}>
            <div className={`${s.heroLeft} ${s.peach}`}>
              <p className={s.heroEyebrow}>Activités outdoor</p>
              <h1 className={s.h1}>Monétisez vos photos. Automatisez vos ventes.</h1>
              <p className={s.lead}>
                Chaque client reçoit sa galerie privée et paie les photos qu’il garde. Le paiement arrive sur votre compte, sans abonnement, depuis votre téléphone.
              </p>
              <div className={s.ctas}>
                <Link href="/signup" className={`${s.btn} ${s.primary}`}>
                  Créer un compte gratuit
                  <Arrow />
                </Link>
                <Link href="/produit#demo" className={`${s.btn} ${s.secondary}`}>
                  Voir la démo
                </Link>
              </div>
              <div className={s.trust}>
                <span>
                  <strong>Sans abonnement</strong> · Paiement Stripe · Données hébergées en UE
                </span>
                <span className={s.trustLine}>Rejoignez les premiers pros qui vendent leurs photos de sortie</span>
              </div>
            </div>

            <div className={s.heroRight} aria-hidden="true">
              <video className={s.heroVideo} src="/landing-payfit/hero.mp4" poster="/landing-payfit/hero-poster.webp" autoPlay muted loop playsInline preload="metadata" />
              <div className={s.phone}>
                <div className={s.phoneScreen}>
                  <span className={s.badge}>
                    <svg width="14" height="14" viewBox="0 -960 960 960" fill="currentColor" stroke="currentColor" strokeLinecap="round">
                      {ACTIVITIES.find((a) => a.name === "Rafting")?.parts.map((p, i) => (
                        <path key={i} d={p.d} transform={p.t || undefined} strokeWidth={p.sw} />
                      ))}
                    </svg>
                    <span>Rafting</span>
                  </span>
                  <span className={s.glassLock}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4.5" y="10.5" width="15" height="10" rx="3" fill="currentColor" stroke="none" />
                      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
                    </svg>
                  </span>
                </div>
                <div className={s.phoneInfo}>
                  <strong>Votre session de Rafting</strong>
                  <span className={s.meta}>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
                        <path d="M3.5 10h17M8 3v4M16 3v4" />
                      </svg>
                      Samedi 26 septembre
                    </span>
                    <span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                        <circle cx="12" cy="10" r="2.3" />
                      </svg>
                      Gorges du Verdon
                    </span>
                  </span>
                  <span className={s.payBtn}>Payer 24,00 €</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* 2. Bandeau d'activités qui défile */}
        <section className={s.acts} aria-label="Activités">
          <p className={s.actsTitle}>Une galerie pour chaque activité</p>
          <div className={s.marquee}>
            <ul className={s.track}>
              {[0, 1].map((copy) =>
                ACTIVITIES.map((a) => (
                  <li key={`${copy}-${a.name}`} className={s.chip} aria-hidden={copy > 0 || undefined}>
                    <ActivityChip a={a} />
                  </li>
                )),
              )}
            </ul>
          </div>
        </section>

        {/* 3. Le trio gagnant */}
        <section className={s.sec}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>Le trio gagnant</p>
            <h2 className={s.h2} style={{ marginBottom: 40 }}>
              Plus de ventes, plus de revenus, plus de visibilité.
            </h2>
            <div className={s.row2}>
              <div className={s.tile} style={{ background: "#FFEDC2" }}>
                <Doodle>
                  <path d="M14 34h-2a8 8 0 0 1-1-15.9A11 11 0 0 1 32 15a8 8 0 0 1 4 19h-2" />
                  <path d="M24 40V23M18 29l6-6 6 6" />
                  <path d="M38 8l2-3M42 12l3-1M34 6l0-3" />
                </Doodle>
                <div className={s.in2}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <h3>Créez vos galeries protégées</h3>
                    <ul className={s.checks}>
                      {["Dépôt sur Linktrip", "Photos triées par départ", "Aperçus filigranés générés", "Vidéos acceptées"].map((t) => (
                        <li key={t}>
                          <CheckCircle />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={s.mock} aria-hidden="true">
                    <div className={s.drop}>Glissez les photos de la sortie</div>
                    {[
                      ["m-parachute", 100, 60],
                      ["m-surf", 64, 45],
                    ].map(([src, w, l]) => (
                      <div key={src} className={s.upRow}>
                        <span className={s.upThumb} style={{ backgroundImage: `url(${M(String(src))})` }} />
                        <span className={s.upBars}>
                          <span style={{ width: `${l}%` }} />
                          <span className={s.bar}>
                            <i style={{ width: `${w}%` }} />
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={s.tile} style={{ background: "linear-gradient(135deg, #F4F2FC 0%, #FFFFFF 55%, #FFF1EA 100%)" }}>
                <Doodle>
                  <rect x="8" y="14" width="26" height="19" rx="3" />
                  <path d="M8 16l13 9 13-9" />
                  <rect x="28" y="24" width="12" height="17" rx="2.5" />
                  <path d="M32 38h4" />
                  <path d="M40 8l2-3M44 13l3-1" />
                </Doodle>
                <h3>Chaque client reçoit sa galerie privée</h3>
                <div className={s.in2} style={{ alignItems: "center" }} aria-hidden="true">
                  <div className={s.mock}>
                    {[
                      ["lea@…", "Envoyé", "#ECE9F9", "#4B3FA0"],
                      ["tom@…", "Ouvert", "#FFEDC2", "#7A4B00"],
                      ["+33 6 …", "Payé", "#FDE1E4", "#B23A52"],
                      ["ines@…", "Payé", "#E6F4EA", "#1E7B3A"],
                    ].map(([who, st, bg, fg]) => (
                      <div key={who} className={s.status}>
                        <span>{who}</span>
                        <span className={s.pill} style={{ background: bg, color: fg }}>
                          {st}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className={s.mock}>
                    <strong>Galerie de Léa</strong>
                    <div className={s.gallery3}>
                      {LEA.map((src) => (
                        <Locked key={src} src={src} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={s.row3}>
              <div className={s.photoTile} role="img" aria-label="Deux pilotes de jet ski sur la mer" style={{ backgroundImage: `url(${M("jet-ski")})`, backgroundPosition: "center 48%" }} />
              <div className={s.tile} style={{ background: "#FDE1E4", justifyContent: "center" }}>
                <Doodle>
                  <rect x="7" y="13" width="30" height="20" rx="3" />
                  <path d="M7 19h30M12 27h7" />
                  <circle cx="36" cy="33" r="7" />
                  <path d="M33 33l2 2 4-4" />
                  <path d="M41 8l2-3M45 13l3-1" />
                </Doodle>
                <h3>Vous encaissez les paiements</h3>
                <ul className={s.checks}>
                  {["Photo à l’unité ou toutes les photos", "Carte, Apple Pay, Google Pay", "Argent versé sur votre compte Stripe", "Reçus à votre nom, suivi des ventes par sortie"].map((t) => (
                    <li key={t}>
                      <CheckCircle />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={s.photoTile} role="img" aria-label="Parachute ascensionnel dans le ciel" style={{ backgroundImage: `url(${M("parachute-ascensionnel")})`, backgroundPosition: "center 42%" }} />
            </div>

            <div className={s.cols3}>
              <div className={s.point}>
                <Icon>
                  <path d="M17.5 6.5A7 7 0 1 0 17.5 17.5" />
                  <path d="M4 10h9M4 14h9" />
                </Icon>
                <strong>Sans abonnement</strong>
                <span>Vous ne payez que sur ce que vous vendez.</span>
              </div>
              <div className={s.point}>
                <Icon>
                  <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" />
                  <path d="M9 12l2 2 4-4" />
                </Icon>
                <strong>Paiement sécurisé</strong>
                <span>Vos ventes arrivent directement sur votre compte.</span>
              </div>
              <div className={s.point}>
                <Icon>
                  <path d="M4 14v-2a8 8 0 0 1 16 0v2" />
                  <rect x="3" y="13" width="4" height="6" rx="1.5" />
                  <rect x="17" y="13" width="4" height="6" rx="1.5" />
                  <path d="M19 19c0 1.5-1.5 2.5-4 2.5h-2" />
                </Icon>
                <strong>SAV 24/7</strong>
                <span>Une équipe joignable à tout moment.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Pourquoi les pros l'adoptent */}
        <section id="pourquoi" className={s.sec}>
          <div className={s.wrap}>
            <div className={s.split}>
              <div>
                <p className={s.eyebrow}>Pensé pour le terrain</p>
                <h2 className={`${s.h2} ${s.h2Big}`}>Pourquoi les pros de l’outdoor l’adoptent ?</h2>
              </div>
              <p className={s.splitText}>
                Linktrip automatise l’envoi et la vente de vos photos pour vous faire gagner du temps, générer des revenus supplémentaires et vous concentrer sur vos clients.
              </p>
            </div>
            <div className={s.why}>
              <div
                className={`${s.whyCard} ${s.whyPhoto}`}
                style={{
                  backgroundImage:
                    "linear-gradient(180deg, rgba(58, 21, 48,0.92) 0%, rgba(58, 21, 48,0.55) 45%, rgba(58, 21, 48,0.05) 100%), url(/landing/immersive/rafting-eaux-vives.webp)",
                }}
              >
                <h3>Ils gagnent du temps</h3>
                <p>Linktrip automatise l’envoi des photos et leur mise en vente. Plus besoin de gérer les transferts, les clés USB ou les paiements manuellement.</p>
              </div>
              <div className={s.whyCard} style={{ background: "#FFEFE7" }}>
                <h3>Ils génèrent des revenus en plus</h3>
                <p>Vos clients retrouvent leurs photos en ligne et les achètent à l’unité ou en pack. Vos photos restent disponibles à la vente, même après l’activité.</p>
                <div className={s.statRow}>
                  <div>
                    <span className={s.statLabel}>Vos photos en vente</span>
                    <strong className={s.statValue}>24 h/24</strong>
                  </div>
                  <svg className={s.doodle} width="64" height="52" viewBox="0 0 64 52" fill="none" stroke="#E8553B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 46 L58 20 L22 30 Z" />
                    <path d="M22 30 L30 44 L58 20" />
                    <path d="M44 6 L46 12 M52 8 L49 13 M58 14 L52 16" />
                  </svg>
                </div>
              </div>
              <div className={s.whyCard} style={{ background: "#FCDCCD" }}>
                <h3>Ils développent leur visibilité</h3>
                <p>Chaque galerie met votre entreprise en avant. Lorsque vos clients partagent leurs souvenirs, ils contribuent aussi à faire connaître votre activité.</p>
                <div className={s.statRow}>
                  <div>
                    <span className={s.statLabel}>Votre marque sur chaque galerie</span>
                    <strong className={s.statValue}>@votreentreprise</strong>
                  </div>
                  <svg className={s.doodle} width="44" height="38" viewBox="0 0 60 52" fill="none" stroke="#E8553B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="6" y="14" width="44" height="30" rx="6" />
                    <path d="M18 14 L22 7 H34 L38 14" />
                    <circle cx="28" cy="29" r="9" />
                    <path d="M50 6 L52 11 M56 10 L52 13" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. La solution : onglets + accordéon */}
        <section id="solution" className={s.sec}>
          <div className={s.wrap}>
            <div className={s.center}>
              <p className={s.eyebrow}>La solution</p>
              <h2 className={s.h2}>Adaptée à votre façon d’encadrer</h2>
            </div>
            <Solution />
          </div>
        </section>

        {/* 6. La démo */}
        <section id="demo" className={s.sec} style={{ paddingTop: 24 }}>
          <div className={s.wrap}>
            <div className={s.demo}>
              <div className={s.demoText}>
                <p className={s.eyebrow} style={{ margin: 0 }}>
                  La démo
                </p>
                <strong>Le parcours complet, en une minute</strong>
                <ol className={s.demoSteps}>
                  <li>
                    <b>1</b>Vous déposez les photos de la sortie
                  </li>
                  <li>
                    <b>2</b>Chaque client reçoit son lien
                  </li>
                  <li>
                    <b>3</b>Il paie, l’argent arrive chez vous
                  </li>
                </ol>
                <Link href="/produit#demo" className={`${s.btn} ${s.primary}`}>
                  Lancer la démo
                  <Arrow />
                </Link>
              </div>
              <Link href="/produit#demo" className={`${s.demoPlayer} ${s.peach}`} aria-label="Lancer la démo produit">
                <span className={s.demoScreen} aria-hidden="true">
                  <span className={s.demoChrome}>
                    <i />
                    <i />
                    <i />
                    <em>linktrip.co/rafting-samedi</em>
                  </span>
                  <span className={s.demoGrid}>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <span key={n} style={{ backgroundImage: `url(/landing-payfit/r-${n}.webp)` }} />
                    ))}
                  </span>
                </span>
                <span className={s.playBtn} aria-hidden="true">
                  <svg width="30" height="30" viewBox="0 0 24 24" style={{ marginLeft: 4 }}>
                    <path d="M7 4.5v15l12.5-7.5z" fill="#E8553B" />
                  </svg>
                </span>
                <span className={s.demoBar} aria-hidden="true">
                  <span>0:00</span>
                  <span className={s.demoTrack}>
                    <i />
                  </span>
                  <span>1:00</span>
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. La prise en main */}
        <section className={s.sec}>
          <div className={s.wrap}>
            <p className={s.eyebrow}>La prise en main</p>
            <h2 className={s.h2} style={{ marginBottom: 36 }}>
              Prêt pour votre prochaine sortie
            </h2>
            <Steps />
            <div className={s.worksWith}>
              <strong>Fonctionne avec</strong>
              <span>
                {["Stripe", "Apple Pay", "Google Pay", "E-mail", "SMS"].map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            </div>
          </div>
        </section>

        {/* 8. Citation */}
        <section className={s.sec} style={{ paddingTop: 0 }}>
          <div className={s.wrap}>
            <div className={s.quote}>
              <div className={s.quoteInner}>
                <blockquote>« Vos clients repartent avec leurs souvenirs. Vous, avec vos ventes. »</blockquote>
                <p>Pendant que vous préparez la prochaine sortie, Linktrip envoie les photos, encaisse les ventes et les verse sur votre compte.</p>
                <div className={s.ctas} style={{ justifyContent: "center" }}>
                  <Link href="/signup" className={`${s.btn} ${s.primary}`}>
                    Créer un compte gratuit
                    <Arrow />
                  </Link>
                  <Link href="/produit#demo" className={`${s.btn} ${s.white}`}>
                    Voir la démo
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 9. Simulateur */}
        <section id="simulateur" className={s.sec}>
          <div className={s.wrap}>
            <div className={s.split}>
              <div>
                <p className={s.eyebrow}>Simulateur</p>
                <h2 className={`${s.h2} ${s.h2Big}`}>Combien pouvez-vous gagner ?</h2>
              </div>
              <p className={s.splitText}>Réglez votre activité d’un mois type : le montant se met à jour tout seul.</p>
            </div>
            <Simulator />
          </div>
        </section>

        {/* 10. FAQ */}
        <section id="faq" className={s.sec}>
          <div className={`${s.wrap} ${s.faq}`}>
            <div>
              <p className={s.eyebrow}>FAQ</p>
              <h2 className={s.h2} style={{ marginBottom: 16 }}>
                Une question ? On vous répond
              </h2>
              <span className={s.faqAside}>
                Une autre question ? <a href="mailto:hello@linktrip.co">Écrivez-nous</a>
              </span>
            </div>
            <div className={s.faqList}>
              {FAQ.map((f) => (
                <details key={f.q} className={s.faqItem}>
                  <summary>
                    {f.q}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 11. Rejoindre (polaroïds) */}
        <section style={{ padding: "40px 24px 88px" }}>
          <div className={`${s.join} ${s.peach}`}>
            {POLAROIDS.map(([img, side, x, top, w, rot, cls]) => (
              <span key={img + side} className={`${s.pol} ${cls}`} aria-hidden="true" style={{ ...(side === "left" ? { left: x } : { right: x }), top, width: w, transform: `rotate(${rot}deg)` }}>
                <span style={{ backgroundImage: `url(${M(img)})` }} />
              </span>
            ))}
            <div className={s.joinInner}>
              <h2 className={`${s.h2} ${s.h2Big}`}>Rejoignez les premiers pros qui vendent leurs photos de sortie</h2>
              <p>Sans abonnement, sans frais cachés.</p>
              <div className={s.ctas} style={{ justifyContent: "center" }}>
                <Link href="/signup" className={`${s.btn} ${s.primary}`}>
                  Créer un compte gratuit
                  <Arrow />
                </Link>
                <Link href="/produit#demo" className={`${s.btn} ${s.secondary}`}>
                  Voir la démo
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Pied de page */}
      <footer className={s.footer}>
        <div className={`${s.foot} ${s.grid}`}>
          <div className={s.footTop}>
            <Link href="/" aria-label="Linktrip, accueil" style={{ display: "inline-flex" }}>
              <LogoOcean height={34} />
            </Link>
            <span className={s.socials}>
              <a href="https://instagram.com/linktrip.co" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/linktrip" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <path d="M8 10.5V16M8 7.6v.1M11.5 16v-3.2c0-1.5 1-2.3 2.1-2.3s2 .8 2 2.3V16M11.5 10.5V16" />
                </svg>
              </a>
              {/* TODO : ajouter TikTok quand le compte existe (même dessin que le canvas). */}
            </span>
          </div>
          <div className={s.footCols}>
            <nav className={s.footCol} aria-label="Linktrip">
              <h4>Linktrip</h4>
              <a href="#pourquoi">Pourquoi Linktrip</a>
              <a href="#solution">Solutions</a>
              <Link href="/produit">Produit</Link>
              <a href="#simulateur">Simulateur</a>
            </nav>
            <nav className={s.footCol} aria-label="Activités">
              <h4>Activités</h4>
              <Link href="/activites/rafting">Rafting</Link>
              <Link href="/activites/canyoning">Canyoning</Link>
              <Link href="/activites/parapente">Parapente</Link>
              <Link href="/activites/plongee">Plongée</Link>
              <Link href="/activites/kayak">Kayak</Link>
            </nav>
            <nav className={s.footCol} aria-label="Ressources">
              <h4>Ressources</h4>
              <Link href="/produit#demo">Démo</Link>
              <a href="#faq">FAQ</a>
              <ManageCookiesLink />
            </nav>
            <nav className={s.footCol} aria-label="Nous joindre">
              <h4>Nous joindre</h4>
              <Link href="/signup">Créer un compte</Link>
              <Link href="/connexion">Se connecter</Link>
              <a href="mailto:hello@linktrip.co">Contact</a>
            </nav>
          </div>
          <div className={s.footBottom}>
            <span className={s.legal}>
              <span>© {year} Linktrip</span>
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/cgv">CGV</Link>
              <Link href="/cgu">CGU</Link>
              <Link href="/confidentialite">Confidentialité</Link>
            </span>
            <span className={s.seals}>
              <span className={s.seal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8553B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="5" y="11" width="14" height="9" rx="2.5" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                Paiement sécurisé par Stripe
              </span>
              <span className={s.seal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8553B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                Données hébergées en UE
              </span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
