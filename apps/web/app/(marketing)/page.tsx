import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import { ActivityMarquee } from "@/components/marketing/ActivityMarquee";
import { ScrollStory } from "@/components/marketing/ScrollStory";
import { WhyLinktrip } from "@/components/marketing/WhyLinktrip";
import styles from "./landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — Ouvrez la boutique photo de votre activité outdoor",
  description:
    "Chaque sortie devient une boutique en ligne. Vos clients achètent leurs photos, vous encaissez. Sans matériel ni abonnement.",
};

export default function AccueilPage() {
  return (
    <div className={styles.page}>
      <div className={styles.haloClip}>
        <span className={styles.auraCool} />
      </div>

      {/* railWide : sur l'accueil la carte du hero doit respirer sur les grands
          écrans, la largeur de lecture de 1320px ne s'y applique pas. */}
      <div className={cx(styles.rail, styles.railWide)}>
        <Header />

        {/* Hero : une seule carte photo plein cadre (cf. docs/maquette-hero-linktrip.html).
            La carte vit dans .rail, elle hérite donc des gouttières ; .heroMain lui
            ajoute la gouttière du bas pour qu'elle ne touche pas le bandeau d'activités. */}
        <main className={cx(styles.main, styles.heroMain)}>
          <div className={styles.heroCard}>
            <Image
              src="/landing/immersive/canyoning-cascade.webp"
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.heroPhoto}
            />
            <div className={styles.heroVeil} aria-hidden="true" />

            <div className={styles.heroContent}>
              <h1 className={cx(styles.h1Hero, styles.reveal, "font-display font-bold text-white")}>
                Transformez les photos de vos sorties en{" "}
                <span className={styles.gradText}>revenus.</span>
              </h1>
              <p className={cx(styles.heroSub, styles.reveal)}>
                Vos clients retrouvent et achètent leurs photos après chaque activité. Vous encaissez.
              </p>
              <div className={cx(styles.heroField, styles.reveal)}>
                <EmailCaptureField />
              </div>
              <p className={cx(styles.heroMicro, styles.reveal)}>Sans abonnement · Sans engagement</p>
            </div>
          </div>
        </main>
      </div>

      {/* Frère de .rail, pas enfant : .rail garantit ses 100svh (cf. landing.module.css
          §0) et le hero doit garder cet écran entier pour lui. Le bandeau vit donc sous
          la ligne de flottaison, avec le pied de page. Il est déjà pleine largeur ici,
          d'où l'absence de `bleed`. */}
      <ActivityMarquee />

      {/* Frère de .rail lui aussi : la section porte son propre pin (position:sticky
          sur 380svh, cf. ScrollStory.module.css) et doit occuper toute la largeur.
          Placée après le bandeau : on montre d'abord les activités couvertes, la
          section immersive sert ensuite de bascule émotionnelle vers le CTA. */}
      <ScrollStory />

      {/* Dernière section avant le pied de page. Elle vient APRÈS la section
          immersive : les photos et l'émotion d'abord, la démonstration par les
          écrans du produit ensuite, juste avant le CTA final. Frère de .rail
          comme les deux précédentes — la dalle prend toute la largeur et porte
          ses propres gouttières via --gutter. */}
      <WhyLinktrip />

      <Footer />
    </div>
  );
}
