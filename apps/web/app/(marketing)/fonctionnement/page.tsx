import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { VideoPlayer } from "@/components/marketing/VideoPlayer";
import styles from "../landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export const metadata: Metadata = {
  title: "Linktrip — De la fin de la sortie au premier encaissement",
  description: "Tout ce qu'un opérateur a réellement à faire, en une minute quarante.",
};

const VIDEO_SRC = "/videos/demo.mp4";
const POSTER_SRC = "/videos/poster.jpg";

export default function FonctionnementPage() {
  const publicDir = path.join(process.cwd(), "public");
  const hasVideo = existsSync(path.join(publicDir, "videos", "demo.mp4"));
  const hasPoster = existsSync(path.join(publicDir, "videos", "poster.jpg"));

  return (
    <div className={styles.page}>
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

          <VideoPlayer hasVideo={hasVideo} hasPoster={hasPoster} videoSrc={VIDEO_SRC} posterSrc={POSTER_SRC} />
        </main>

        <Footer variant="fonctionnement" />
      </div>
    </div>
  );
}
