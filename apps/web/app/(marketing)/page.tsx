import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import { PhotoMosaic } from "@/components/marketing/PhotoMosaic";
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
      <span className={styles.auraWarm} />
      <span className={styles.auraCool} />

      <div className={styles.rail}>
        <Header />

        <main
          className={cx(
            styles.main,
            "grid items-stretch gap-[58px] py-4 min-[1000px]:grid-cols-[minmax(0,440px)_1fr] min-[1000px]:gap-[clamp(58px,6vw,120px)]",
          )}
        >
          <div className="flex flex-col justify-center">
            <h1 className={cx(styles.h1Accueil, styles.reveal, "font-display font-bold text-ink")}>
              Ouvrez la boutique photo de <span className={styles.gradText}>votre activité outdoor.</span>
            </h1>
            <p className={cx(styles.reveal, "mt-[clamp(14px,2vh,24px)] max-w-[470px] text-[clamp(15px,0.6vw+0.7vh,17.5px)] leading-[1.55] text-ink-2")}>
              Chaque sortie devient une boutique en ligne&nbsp;: vos clients y retrouvent leurs photos et achètent
              celles qu&apos;ils veulent. Vous encaissez, sans matériel ni&nbsp;abonnement.&nbsp;🇪🇺
            </p>

            <div className={cx(styles.reveal, "mt-[clamp(20px,3.4vh,36px)]")}>
              <EmailCaptureField />
            </div>

            <p className={cx(styles.reveal, "ml-[9px] mt-[clamp(18px,3.2vh,30px)]")}>
              <Link
                href="/fonctionnement"
                className="border-b-[1.5px] border-line text-[13.5px] font-semibold text-ink transition hover:border-brand"
              >
                Voir le produit en vidéo <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>

          <div className="flex min-h-0 flex-col justify-center">
            <PhotoMosaic />
          </div>
        </main>

        <Footer variant="accueil" />
      </div>
    </div>
  );
}
