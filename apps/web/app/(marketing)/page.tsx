/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Barlow_Condensed } from "next/font/google";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";
import { LandingHeader } from "@/components/marketing/landing-v2/LandingHeader";
import { LogoOcean } from "@/components/marketing/landing-v2/LogoOcean";
import { RevenueSimulator } from "@/components/marketing/landing-v2/RevenueSimulator";
import { ACTIVITIES, BENEFITS } from "@/components/marketing/landing-v2/landing-data";
import s from "./landing-v2.module.css";

/* Accueil, refonte du 17/10/2026 : portée depuis le canvas Claude Design
   « Landing, hero avec design system » (bleu Océan). L'ancien accueil
   (accueil.css, landing.module.css, AccueilAnime) n'est plus importé ; il
   reste dans l'historique git (commit 4842b55) si on doit y revenir. */

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--lt-font" });
const condensed = Barlow_Condensed({ subsets: ["latin"], weight: ["600"], variable: "--lt-condensed" });

const TITLE = "Linktrip · Vendez à vos clients les photos de leur sortie";
const DESCRIPTION = "L’outil le plus simple pour vendre vos photos et vidéos de session. Sans abonnement, sans effort.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", siteName: "Linktrip", locale: "fr_FR", type: "website" },
  twitter: { card: "summary", title: TITLE, description: DESCRIPTION },
};

const FAQ: { q: string; a: string }[] = [
  { q: "Faut-il du matériel particulier ?", a: "Non, votre appareil photo ou votre téléphone suffit." },
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

const INCLUDED = ["Sans abonnement", "Sans frais d’inscription", "Galeries privées illimitées", "Paiement sécurisé par Stripe*", "Sans engagement"];

const WALL: [string, string][] = [
  ["/landing-v2/rafting-drone.webp", "Rafting"],
  ["/landing-v2/sortie-1.webp", "Rafting"],
  ["/landing/immersive/canyoning-cascade.webp", "Canyoning"],
  ["/landing-v2/sortie-3.webp", "Rafting"],
  ["/landing-v2/rafting-bleu.webp", "Eaux vives"],
  ["/landing-v2/sortie-2.webp", "Rafting"],
  ["/landing-v2/sortie-4.webp", "Rafting"],
  ["/landing/immersive/rafting-eaux-vives.webp", "Rafting"],
  ["/landing-v2/sortie-5.webp", "Rafting"],
];

const STEP_THUMBS = ["sortie-1", "sortie-2", "sortie-3", "sortie-4", "sortie-5"];

const SALES = [
  { who: "Léa M.", what: "Lot complet", amount: "25,00 €" },
  { who: "Tom B.", what: "3 photos", amount: "12,00 €" },
  { who: "Inès R.", what: "1 vidéo", amount: "8,00 €" },
];

const WAVE = "M0,40 C180,8 360,0 540,14 C720,28 900,44 1080,30 C1260,16 1350,10 1440,14 L1440,40 Z";

/** Cadenas des aperçus, celui de components/gallery/PhotoPicker.tsx. */
function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-56 -56 112 112" aria-hidden="true">
      <circle r="55.5" fill="rgba(20, 19, 32, 0.55)" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
      <g transform="translate(0 2)" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="-17" y="-4" width="34" height="24" rx="5" />
        <path d="M-10-4v-10a10 10 0 0 1 20 0v10" />
      </g>
    </svg>
  );
}

function Check({ size = 16, color = "#1E7B3A", width = 2.25 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12l5 5L19 7" />
    </svg>
  );
}

function Wave() {
  return (
    <svg className={s.wave} aria-hidden="true" viewBox="0 0 1440 40" preserveAspectRatio="none">
      <path d={WAVE} fill="#F7F8FA" />
    </svg>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: React.ReactNode }) {
  return (
    <>
      <p className={`${s.eyebrow} ${s.reveal}`}>{eyebrow}</p>
      <h2 className={`${s.h2} ${s.reveal}`}>{title}</h2>
      <p className={`${s.sub} ${s.reveal}`}>{sub}</p>
    </>
  );
}

export default function HomePage() {
  return (
    <div className={`${inter.variable} ${condensed.variable} ${s.page}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }} />
      <LandingHeader />

      <main>
        {/* 1. Hero */}
        <section className={s.hero}>
          <div className={`${s.wrap} ${s.heroGrid}`}>
            <div className={s.heroText}>
              <span className={s.pill}>Pour les pros de l’outdoor</span>
              <h1 className={s.h1}>Vendez les photos de vos sorties à vos clients.</h1>
              <p className={s.lead}>Linktrip est l’outil le plus simple pour vendre vos photos et vidéos de session. Sans abonnement, sans effort.</p>
              <div className={s.ctas}>
                <Link href="/signup" className={`${s.btn} ${s.primary} ${s.heroCta}`}>
                  Créer un compte gratuit
                </Link>
                <Link href="/produit#demo" className={`${s.btn} ${s.ghost}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M8 5.5v13l11-6.5z" />
                  </svg>
                  Voir la démo
                </Link>
              </div>
              <div className={s.checks}>
                <span>
                  <Check />
                  Sans abonnement
                </span>
                <span>
                  <Check />
                  Sans engagement
                </span>
              </div>
            </div>
            <div className={s.heroVisual} aria-hidden="true">
              <div className={s.heroPhoto}>
                <img src="/landing-v2/rafting-drone.webp" alt="" fetchPriority="high" />
              </div>
            </div>
          </div>
        </section>

        {/* 2. Activités */}
        <section className={s.acts} aria-label="Activités">
          <div className={s.wrap}>
            <ul className={s.actsList}>
              {ACTIVITIES.map((a) => (
                <li key={a.name}>
                  <svg width="24" height="24" viewBox="0 -960 960 960" aria-hidden="true" fill="currentColor" stroke="currentColor" strokeLinecap="round" style={{ flexShrink: 0 }}>
                    {a.parts.map((p, i) => (
                      <path key={i} d={p.d} transform={p.t || undefined} strokeWidth={p.sw} />
                    ))}
                  </svg>
                  {a.name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 3. Pourquoi Linktrip */}
        <section className={s.sec}>
          <div className={s.wrap}>
            <SectionHead eyebrow="Vos avantages" title="Pourquoi Linktrip" sub="Augmentez vos revenus et votre notoriété." />
            <div className={s.grid3}>
              {BENEFITS.map((b) => (
                <div key={b.title} className={`${s.card} ${s.benefit} ${s.reveal}`}>
                  <span className={s.benefitIcon} aria-hidden="true">
                    <svg width="26" height="26" viewBox="0 -960 960 960" fill="currentColor">
                      <path d={b.icon} />
                    </svg>
                  </span>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 bis. Mur de photos */}
        <section className={s.wall} aria-label="Photos de sorties">
          <p className={`${s.wallTitle} ${s.reveal}`}>Pour tous les souvenirs</p>
          <div className={s.track} aria-hidden="true">
            {[...WALL, ...WALL].map(([src, label], i) => (
              <figure key={i} className={s.tile}>
                <img src={src} alt="" loading="lazy" decoding="async" />
                <figcaption>{label}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* 4. Comment ça marche */}
        <section id="fonctionnement" className={`${s.sec} ${s.grey} ${s.waved}`}>
          <Wave />
          <div className={s.wrap}>
            <SectionHead eyebrow="En 3 étapes" title="Comment ça marche" sub="Automatisez la vente de vos photos" />
            <ol className={s.steps}>
              <li className={`${s.card} ${s.step} ${s.reveal}`}>
                <div className={s.stepHead}>
                  <span className={s.stepNum}>1</span>
                  <h3>Ajoutez les photos</h3>
                </div>
                <div className={s.stepText}>
                  <p>Linktrip prépare les aperçus filigranés et la page de vente.</p>
                </div>
                <div className={s.visual} aria-hidden="true">
                  <div className={s.visualHead}>
                    <strong>Rafting, samedi 14 h</strong>
                  </div>
                  <div className={s.thumbs}>
                    {STEP_THUMBS.map((t) => (
                      <span key={t} className={s.thumb}>
                        <img src={`/landing-v2/${t}.webp`} alt="" loading="lazy" />
                        <Lock className={s.lock} />
                      </span>
                    ))}
                    {[0, 1, 2].map((i) => (
                      <span key={`vide-${i}`} className={s.thumb} />
                    ))}
                  </div>
                </div>
              </li>

              <li className={`${s.card} ${s.step} ${s.reveal}`}>
                <div className={s.stepHead}>
                  <span className={s.stepNum}>2</span>
                  <h3>Envoyez les galeries</h3>
                </div>
                <div className={s.stepText}>
                  <p>Collez la liste des emails, chaque client reçoit le lien de sa galerie privée.</p>
                </div>
                <div className={s.visual} aria-hidden="true">
                  <strong style={{ fontWeight: 600 }}>E-mails du groupe</strong>
                  <div className={s.emails}>
                    {["lea@…", "tom@…", "ines@…"].map((e) => (
                      <span key={e} className={s.chip}>
                        {e}
                      </span>
                    ))}
                    <span className={s.more}>+ 4</span>
                  </div>
                  <div className={s.sendRow}>
                    <span>8 clients</span>
                    <span className={s.sendBtn}>Envoyer</span>
                  </div>
                </div>
              </li>

              <li className={`${s.card} ${s.step} ${s.reveal}`}>
                <div className={s.stepHead}>
                  <span className={s.stepNum}>3</span>
                  <h3>Encaissez vos ventes</h3>
                </div>
                <div className={s.stepText}>
                  <p>Vos clients achètent en ligne leurs photos et reçoivent leur facture.</p>
                </div>
                <div className={s.visual} aria-hidden="true">
                  <div className={s.visualHead}>
                    <strong>Ventes de la sortie</strong>
                  </div>
                  <div className={s.sales}>
                    {SALES.map((v) => (
                      <div key={v.who} className={s.sale}>
                        <span>
                          <strong>{v.who}</strong>
                          {v.what}
                        </span>
                        <b>{v.amount}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </li>
            </ol>
            <div className={s.ctaRow}>
              <Link href="/signup" className={`${s.btn} ${s.primary}`}>
                Créer un compte gratuit
              </Link>
              <Link href="/produit#demo" className={s.textLink}>
                Voir la démo
              </Link>
            </div>
          </div>
        </section>

        {/* 5. Tarif */}
        <section id="tarif" className={s.sec}>
          <div className={`${s.wrap} ${s.center}`}>
            <SectionHead eyebrow="Tarif" title="Un tarif simple" sub="Sans abonnement et sans engagement" />
            <div className={`${s.card} ${s.price} ${s.reveal}`}>
              <span className={s.badge}>Une seule formule</span>
              <div className={s.bigRow}>
                <span className={s.big}>20 %</span>
                <span>par vente</span>
              </div>
              <div className={s.rule} />
              <ul className={s.included}>
                {INCLUDED.map((t) => (
                  <li key={t}>
                    <span className={s.tick} aria-hidden="true">
                      <Check size={14} color="currentColor" width={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className={`${s.btn} ${s.primary} ${s.block}`}>
                Créer un compte gratuit
              </Link>
              <p className={s.note}>* Frais Stripe : 1,5 % + 0,25 € par paiement.</p>
            </div>
          </div>
        </section>

        {/* 6. Simulateur */}
        <section id="simulateur" className={`${s.sec} ${s.grey} ${s.waved}`}>
          <Wave />
          <div className={s.wrap}>
            <SectionHead eyebrow="Simulateur" title="Simulez vos revenus" sub="Ajustez les curseurs à votre activité." />
            <RevenueSimulator />
            <p className={s.disclaimer}>Cette estimation est indicative.</p>
          </div>
        </section>

        {/* 7. FAQ */}
        <section id="faq" className={s.sec}>
          <div className={`${s.wrap} ${s.faqWrap}`}>
            <SectionHead
              eyebrow="FAQ"
              title="Questions fréquentes"
              sub={
                <>
                  Une autre question ? <a href="mailto:hello@linktrip.co">Écrivez-nous</a>
                </>
              }
            />
            <div className={s.faqList}>
              {FAQ.map((f) => (
                <details key={f.q} className={s.faqItem}>
                  <summary>
                    <span>{f.q}</span>
                    <span className={s.plus} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 -960 960 960" fill="currentColor">
                        <path d="M440-440H240q-17 0-28.5-11.5T200-480q0-17 11.5-28.5T240-520h200v-200q0-17 11.5-28.5T480-760q17 0 28.5 11.5T520-720v200h200q17 0 28.5 11.5T760-480q0 17-11.5 28.5T720-440H520v200q0 17-11.5 28.5T480-200q-17 0-28.5-11.5T440-240v-200Z" />
                      </svg>
                    </span>
                  </summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 8. CTA final */}
        <section className={s.finalSec}>
          <div className={s.final}>
            <img className={s.finalBg} src="/landing-v2/rafting-drone.webp" alt="" aria-hidden="true" loading="lazy" />
            <span className={s.finalShade} aria-hidden="true" />
            <h2>Prêt à vendre vos photos ?</h2>
            <p>Créez votre compte en 3 minutes.</p>
            <div className={s.finalCtas}>
              <Link href="/signup" className={`${s.btn} ${s.white}`}>
                Créer un compte gratuit
              </Link>
              <Link href="/produit#demo" className={`${s.btn} ${s.outlineWhite}`}>
                Voir la démo
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={s.footer}>
        <div className={`${s.wrap} ${s.footInner}`}>
          <div className={s.footCols}>
            <div className={s.footBrand}>
              <Link href="/" aria-label="Linktrip, accueil" style={{ display: "inline-flex" }}>
                <LogoOcean height={28} />
              </Link>
              <span>La vente de photos et vidéos pour les pros de l’outdoor.</span>
              <Link href="/signup" className={`${s.btn} ${s.primary}`}>
                Créer un compte gratuit
              </Link>
            </div>
            <nav aria-label="Produit" className={s.footCol}>
              <h4>Produit</h4>
              <a href="#fonctionnement">Fonctionnement</a>
              <a href="#tarif">Tarif</a>
              <a href="#simulateur">Simulateur</a>
              <a href="#faq">FAQ</a>
              <Link href="/connexion">Connexion</Link>
            </nav>
            <nav aria-label="Légal" className={s.footCol}>
              <h4>Légal</h4>
              <Link href="/mentions-legales">Mentions légales</Link>
              <Link href="/cgu">CGU</Link>
              <Link href="/cgv">CGV</Link>
              <Link href="/confidentialite">Confidentialité</Link>
              <ManageCookiesLink />
            </nav>
            <div className={s.footCol}>
              <h4>Contact</h4>
              <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>
              <a href="https://instagram.com/linktrip.co" target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
              <a href="https://linkedin.com/company/linktrip" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
          <div className={s.footBottom}>
            <span>© {new Date().getFullYear()} Linktrip</span>
            <span>
              <svg width="14" height="14" viewBox="-56 -56 112 112" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="-26" y="-6" width="52" height="38" rx="8" />
                  <path d="M-15-6v-16a15 15 0 0 1 30 0v16" />
                </g>
              </svg>
              Paiements sécurisés par Stripe
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
