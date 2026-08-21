import type { CSSProperties } from "react";
import Image from "next/image";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import styles from "./WhyLinktrip.module.css";

/* Section « Pourquoi Linktrip ? » — quatre bénéfices, quatre écrans.

   Deux règles ont dicté ce composant :
   1. Les visuels sont des CALQUES d'écrans réels (revenus opérateur, relances
      automatiques, galerie client), jamais des schémas décoratifs. Un écran qui
      bouge dans le produit doit être répercuté ici.
   2. Un intitulé, un titre, une phrase par rangée. La démonstration est portée
      par le visuel, pas par le texte.

   Server Component : le seul comportement est l'apparition au défilement,
   assurée par <ScrollReveal /> (client) monté une fois en fin de section. */

const SALES = [
  { face: "camille", name: "Camille A.", activity: "Rafting · 14 août", amount: "24 €" },
  { face: "lucas", name: "Lucas M.", activity: "Canyoning · 14 août", amount: "18 €" },
  { face: "emma", name: "Emma R.", activity: "Parapente · 13 août", amount: "32 €" },
  { face: "chloe", name: "Chloé T.", activity: "Escalade · 13 août", amount: "24 €" },
];

/* Libellés repris mot pour mot de components/reglages/ReglagesForm.tsx. */
const RELANCES = [
  {
    title: "Ils n'ont pas ouvert",
    hint: "Deux heures après, on leur remet le lien. Ils sont souvent encore sur la route.",
  },
  {
    title: "Ils ont regardé sans acheter",
    hint: "Le lendemain, on leur propose leurs photos à prix réduit. C'est ce qui rapporte le plus.",
  },
  {
    title: "Ils ont acheté",
    hint: "On leur demande un avis Google. Vos meilleures notes viennent de là.",
  },
];

/* Cœurs de la story : position, taille, décalage et durée. Les durées sont
   volontairement toutes différentes — synchronisées, la boucle se voit. */
const HEARTS = [
  { x: "62%", y: "72%", s: "34px", d: "0s", t: "4.6s" },
  { x: "76%", y: "80%", s: "26px", d: ".7s", t: "5.2s" },
  { x: "52%", y: "84%", s: "22px", d: "1.5s", t: "4.9s" },
  { x: "70%", y: "88%", s: "30px", d: "2.3s", t: "5.6s" },
  { x: "44%", y: "78%", s: "18px", d: "3s", t: "4.4s" },
  { x: "82%", y: "70%", s: "20px", d: "3.6s", t: "5.1s" },
];

const HEART_PATH = "M12 20.6s-7.6-4.7-7.6-10.1a4.3 4.3 0 0 1 7.6-2.7 4.3 4.3 0 0 1 7.6 2.7c0 5.4-7.6 10.1-7.6 10.1Z";

/* 16 marques suffisent à couvrir le cadre une fois la trame pivotée (.wm). */
const WATERMARKS = Array.from({ length: 16 });

const GALLERY_THUMBS = ["parapente-biplace", "escalade-falaise", "tyrolienne-foret"];

export function WhyLinktrip() {
  return (
    <section className={styles.section} aria-labelledby="pourquoi-linktrip">
      {/* Sans JS, .reveal (globals.css) resterait à opacity:0 : ce repli garantit
          que la section est lisible même si ScrollReveal ne s'hydrate jamais. */}
      <noscript>
        <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
      </noscript>

      <div className={styles.panel}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Pourquoi Linktrip ?</p>
          <h2 id="pourquoi-linktrip" className={styles.h2}>
            Quatre bonnes raisons de <span className={styles.grad}>s&rsquo;y mettre</span>
          </h2>
          <p className={styles.sub}>
            Vos photos deviennent un revenu, un canal d&rsquo;avis et un souvenir, sans rien changer à votre façon de
            travailler.
          </p>
        </div>

        <div className={styles.rows}>
          {/* 1 · Revenus — calque de app/(operator)/revenus */}
          <article
            className={`${styles.row} reveal`}
            style={
              {
                "--glow": "radial-gradient(closest-side,rgba(255,90,31,.30),transparent)",
              } as CSSProperties
            }
          >
            <div className={styles.visual}>
              <div className={styles.ui}>
                <div className={styles.uiBar}>
                  <Logo variant="symbol" height={22} title={null} />
                  <b>Revenus</b>
                </div>
                <div className={styles.uiBody}>
                  <p className={styles.total}>1&#8239;240,00&nbsp;€</p>
                  <div className={styles.sales}>
                    {SALES.map((sale) => (
                      <div key={sale.name} className={styles.sale}>
                        <Image
                          className={styles.av}
                          src={`/landing/faces/${sale.face}.webp`}
                          alt=""
                          width={36}
                          height={36}
                        />
                        <span className={styles.who}>
                          <b>{sale.name}</b>
                          <small>{sale.activity}</small>
                        </span>
                        <span className={styles.amt}>{sale.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.copy}>
              <span className={styles.kicker}>Revenus</span>
              <h3>Un revenu de plus à chaque sortie</h3>
              <p>Les photos que vous prenez déjà se vendent toutes seules, 24&nbsp;h/24, sans rien investir.</p>
            </div>
          </article>

          {/* 2 · Bouche-à-oreille — la photo repartagée en story */}
          <article
            className={`${styles.row} reveal`}
            style={
              {
                "--glow": "radial-gradient(closest-side,rgba(255,61,110,.28),transparent)",
              } as CSSProperties
            }
          >
            <div className={styles.visual}>
              <div className={styles.story}>
                <div className={styles.storyScreen}>
                  <Image
                    className={styles.storyImg}
                    src="/landing/immersive/rafting-eaux-vives.webp"
                    alt="Une participante partage sa photo de rafting en story"
                    fill
                    sizes="(max-width: 900px) 70vw, 262px"
                  />
                  <span className={styles.storyVeil} />

                  <div className={styles.storyBars} aria-hidden="true">
                    <i className={styles.on} />
                    <i />
                    <i />
                  </div>

                  <div className={styles.storyTop}>
                    <Image className={styles.storyAv} src="/landing/faces/camille.webp" alt="" width={26} height={26} />
                    <b>camille.a</b>
                    <span>2 h</span>
                  </div>

                  <span className={styles.mention}>
                    <Logo variant="symbol" height={15} title={null} />
                    @aventure.ardeche
                  </span>

                  <div className={styles.hearts} aria-hidden="true">
                    {HEARTS.map((heart, i) => (
                      <svg
                        key={i}
                        viewBox="0 0 24 24"
                        style={
                          {
                            "--x": heart.x,
                            "--y": heart.y,
                            "--s": heart.s,
                            "--d": heart.d,
                            "--t": heart.t,
                          } as CSSProperties
                        }
                      >
                        <path d={HEART_PATH} fill="currentColor" />
                      </svg>
                    ))}
                  </div>

                  <div className={styles.storyReply}>
                    <span className={styles.rep}>Envoyer un message</span>
                    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={HEART_PATH} fill="currentColor" />
                    </svg>
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M21.5 2.5 11 13" />
                      <path d="M21.5 2.5 15 21l-4-8-8-4 18.5-6.5Z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.copy}>
              <span className={styles.kicker}>Bouche-à-oreille</span>
              <h3>Vos clients parlent de vous</h3>
              <p>Ils partagent leurs photos, vous taguent, et leurs amis découvrent votre activité.</p>
            </div>
          </article>

          {/* 3 · Automatisation — calque de components/reglages/ReglagesForm */}
          <article
            className={`${styles.row} reveal`}
            style={
              {
                "--glow": "radial-gradient(closest-side,rgba(15,190,182,.26),transparent)",
              } as CSSProperties
            }
          >
            <div className={styles.visual}>
              <div className={styles.ui}>
                <div className={styles.uiBar}>
                  <Logo variant="symbol" height={22} title={null} />
                  <b>Réglages</b>
                </div>
                <div className={styles.uiBody}>
                  <p className={styles.lbl}>On relance à votre place</p>
                  <div className={styles.auto}>
                    {RELANCES.map((relance) => (
                      <div key={relance.title} className={styles.autoLine}>
                        <span className={styles.rel}>
                          <b>{relance.title}</b>
                          <small>{relance.hint}</small>
                        </span>
                        <span className={styles.sw} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.copy}>
              <span className={styles.kicker}>Automatisation</span>
              <h3>Tout ce qui suit la sortie tourne sans vous</h3>
              <p>
                Galerie, envoi, paiement, relances : vos équipes n&rsquo;ont rien à faire de plus qu&rsquo;aujourd&rsquo;hui.
              </p>
            </div>
          </article>

          {/* 4 · Expérience client — calque de la barre d'achat de BoutiqueGallery */}
          <article
            className={`${styles.row} reveal`}
            style={
              {
                "--glow": "radial-gradient(closest-side,rgba(255,180,67,.26),transparent)",
              } as CSSProperties
            }
          >
            <div className={styles.visual}>
              <div className={styles.phone}>
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneBar}>
                    <Logo variant="symbol" height={17} title={null} />
                    <b>Vos photos</b>
                    <small>Canyoning · 14 août</small>
                  </div>

                  <div className={styles.shot}>
                    <Image
                      className={styles.shotImg}
                      src="/landing/immersive/canyoning-cascade.webp"
                      alt="Aperçu filigrané d'une photo de canyoning dans la galerie du client"
                      fill
                      sizes="(max-width: 900px) 60vw, 230px"
                    />
                    <div className={styles.wm} aria-hidden="true">
                      {WATERMARKS.map((_, i) => (
                        <span key={i}>aventure ardèche</span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.thumbs}>
                    {GALLERY_THUMBS.map((src) => (
                      <div key={src} className={styles.thumb}>
                        <Image src={`/landing/immersive/${src}.webp`} alt="" fill sizes="80px" />
                      </div>
                    ))}
                  </div>

                  <div className={styles.buybar}>
                    <div className={styles.buybarTop}>
                      <span className={styles.n}>3 photos</span>
                      <span className={styles.tot}>24&nbsp;€</span>
                    </div>
                    <div className={styles.pay}>Récupérer mes photos</div>
                    <p className={styles.trust}>Téléchargement immédiat, sans filigrane.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.copy}>
              <span className={styles.kicker}>Expérience client</span>
              <h3>Une expérience qui continue après l&rsquo;activité</h3>
              <p>Vos clients retrouvent leurs photos en un lien, sans compte ni application à télécharger.</p>
            </div>
          </article>
        </div>

        <div className={styles.cta}>
          <ButtonLink href="/liste-attente" variant="sunset" size="lg">
            Rejoindre la liste d&rsquo;attente <span aria-hidden="true">→</span>
          </ButtonLink>
          <p className={styles.ctaNote}>Sans abonnement · Sans engagement</p>
        </div>
      </div>

      <ScrollReveal />
    </section>
  );
}

export default WhyLinktrip;
