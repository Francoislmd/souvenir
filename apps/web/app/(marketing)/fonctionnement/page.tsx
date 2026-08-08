import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArcadeEmbed } from "@/components/marketing/ArcadeEmbed";
import styles from "../landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — De la fin de la sortie au premier encaissement",
  description: "Tout ce qu'un opérateur a réellement à faire, en une minute quarante.",
};

export default function FonctionnementPage() {
  return (
    <div className={cx(styles.page, styles.pageArcade)}>
      <span className={styles.auraWarmCenter} />
      <span className={styles.auraCool} />

      <div className={styles.rail}>
        <Header current="fonctionnement" />

        <main className={cx(styles.main, "flex flex-col justify-center py-4")}>
          <div className="mx-auto max-w-[760px] pt-[clamp(8px,2vh,22px)] text-center">
            <h1 className={cx(styles.h1Video, styles.reveal, "font-display font-bold text-ink")}>
              De la fin de la sortie <span className={styles.gradText}>au premier encaissement.</span>
            </h1>
            <p className={cx(styles.reveal, "mx-auto mt-[clamp(10px,1.6vh,18px)] max-w-[560px] text-[clamp(15px,0.55vw+0.6vh,17.5px)] text-ink-2")}>
              Tout ce qu&apos;un opérateur a réellement à faire, en une minute quarante.
            </p>
          </div>

          <ArcadeEmbed />
        </main>

        <Footer />
      </div>
    </div>
  );
}
