import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { WaitlistForm } from "@/components/marketing/WaitlistForm";
import styles from "../landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — Vos 3 premiers mois sans commission",
  description: "Rejoignez la liste d'attente et profitez de 3 mois sans commission à l'ouverture.",
};

interface ListeAttentePageProps {
  searchParams: { email?: string };
}

export default function ListeAttentePage({ searchParams }: ListeAttentePageProps) {
  return (
    <div className={styles.page}>
      <div className={styles.haloClip}>
        <span className={styles.auraWarm} />
        <span className={styles.auraCool} />
      </div>

      <div className={styles.rail}>
        <Header current="liste-attente" />

        <main className={cx(styles.main, "flex flex-col justify-center py-4")}>
          <div className="mx-auto mb-[clamp(16px,2.8vh,30px)] max-w-[640px] text-center">
            <h1 className={cx(styles.h1Waitlist, styles.reveal, "font-display font-bold text-ink")}>
              Vos 3 premiers mois <span className={styles.gradText}>sans commission.</span>
            </h1>
          </div>

          <div className={styles.reveal}>
            <WaitlistForm initialEmail={searchParams.email} />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
