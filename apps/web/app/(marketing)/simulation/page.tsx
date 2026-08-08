import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { RevenueSlider } from "@/components/marketing/RevenueSlider";
import styles from "../landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — Combien votre saison peut vous rapporter",
  description: "Simulez vos revenus complémentaires selon vos sorties, vos participants et votre prix de vente.",
};

export default function SimulationPage() {
  return (
    <div className={styles.page}>
      <div className={styles.haloClip}>
        <span className={styles.auraWarm} />
        <span className={styles.auraCool} />
      </div>

      <div className={styles.rail}>
        <Header current="simulation" />

        <main className={cx(styles.main, "flex flex-col justify-center py-4")}>
          <div className="mx-auto mb-[clamp(16px,2.6vh,30px)] max-w-[720px] text-center">
            <h1 className={cx(styles.h1Sim, styles.reveal, "font-display font-bold text-ink")}>
              Combien votre saison <span className={styles.gradText}>peut vous rapporter.</span>
            </h1>
            <p className={cx(styles.reveal, "mt-[clamp(8px,1.4vh,15px)] text-[clamp(14px,0.5vw+0.55vh,16.5px)] text-ink-2")}>
              Réglez les curseurs sur votre activité réelle.
            </p>
          </div>

          <div className={styles.reveal}>
            <RevenueSlider />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
