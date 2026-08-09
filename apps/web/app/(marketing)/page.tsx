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
      <div className={styles.haloClip}>
        <span className={styles.auraWarm} />
        <span className={styles.auraCool} />
      </div>

      <div className={styles.rail}>
        <Header />

        <main
          className={cx(
            styles.main,
            "grid items-stretch gap-5 pt-[52px] pb-4 min-[1000px]:py-4 min-[1000px]:grid-cols-[minmax(0,460px)_minmax(0,1fr)] min-[1000px]:gap-[clamp(60px,7vw,120px)]",
          )}
        >
          <div className="min-w-0 flex flex-col justify-center">
            <h1 className={cx(styles.h1Accueil, styles.reveal, "font-display font-bold text-ink")}>
              Ouvrez la boutique photo de <span className={styles.gradText}>votre activité outdoor.</span>
            </h1>
            <div className={cx(styles.reveal, "mt-[14px] max-w-[470px] min-[1000px]:mt-[clamp(14px,2vh,24px)]")}>
              <p className="hidden text-[clamp(15px,0.6vw+0.7vh,17.5px)] leading-[1.55] text-ink-2 min-[1000px]:block">
                Chaque sortie devient une boutique en ligne&nbsp;: vos clients y retrouvent leurs photos et achètent
                celles qu&apos;ils veulent. Vous encaissez, sans matériel ni&nbsp;abonnement.
              </p>
              <p className="text-[15.5px] leading-[1.5] text-ink-2 min-[1000px]:hidden">
                Chaque sortie devient une boutique en ligne. Vos clients achètent leurs photos, vous encaissez.
                Sans matériel ni&nbsp;abonnement.
              </p>
            </div>

            <div className={cx(styles.reveal, "mt-[20px] min-[1000px]:mt-[clamp(20px,3.4vh,36px)]")}>
              <EmailCaptureField />
            </div>

            <p
              className={cx(
                styles.reveal,
                "ml-0 mt-[20px] mb-[20px] text-center min-[1000px]:ml-[9px] min-[1000px]:mt-[clamp(18px,3.2vh,30px)] min-[1000px]:mb-0 min-[1000px]:text-left",
              )}
            >
              <Link
                href="/fonctionnement"
                className="border-b-[1.5px] border-line text-[14px] font-semibold text-ink transition min-[1000px]:text-[13.5px] [@media(hover:hover)]:hover:border-brand"
              >
                Voir le produit en vidéo <span aria-hidden="true">→</span>
              </Link>
            </p>
          </div>

          <div className="min-h-0 min-w-0">
            <PhotoMosaic />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
