import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArcadeEmbed } from "@/components/marketing/ArcadeEmbed";
import { ButtonLink } from "@/components/ui/Button";
import styles from "../landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — De la fin de la sortie au premier encaissement",
  description: "Tout ce qu'un opérateur a réellement à faire, en une minute quarante.",
};

export default function FonctionnementPage() {
  return (
    <div className={styles.page}>
      <div className={styles.haloClip}>
        <span className={styles.auraWarmCenter} />
        <span className={styles.auraCool} />
      </div>

      <div className={styles.rail}>
        <Header current="fonctionnement" />

        <main className={cx(styles.main, "flex flex-col justify-center py-4 max-[999px]:justify-start max-[999px]:pt-[52px]")}>
          <div className="mx-auto max-w-[760px] pt-[clamp(8px,2vh,22px)] text-center max-[999px]:pt-0">
            <h1 className={cx(styles.h1Video, styles.reveal, "font-display font-bold text-ink")}>
              De la fin de la sortie <span className={styles.gradText}>au premier encaissement.</span>
            </h1>
            <p className={cx(styles.reveal, "mx-auto mt-[clamp(10px,1.6vh,18px)] max-w-[560px] text-[clamp(15px,0.55vw+0.6vh,17.5px)] text-ink-2")}>
              Tout ce qu&apos;un opérateur a réellement à faire, en une minute quarante.
            </p>
          </div>

          <ArcadeEmbed />

          {/* CTA repris du header (masqué sur mobile, cf. .headerCta) : sans lui,
              un visiteur mobile n'a aucun accès direct à la liste d'attente
              depuis cette page hors menu déroulant. */}
          <div className={cx(styles.reveal, "hidden text-center max-[999px]:mt-7 max-[999px]:block")}>
            <ButtonLink href="/liste-attente" variant="sunset" size="lg">
              Rejoindre la liste d&apos;attente <span aria-hidden="true">→</span>
            </ButtonLink>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
