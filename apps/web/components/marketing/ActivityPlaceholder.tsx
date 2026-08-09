import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import styles from "@/app/(marketing)/landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface ActivityPlaceholderProps {
  /** Nom de l'activité affiché en titre, ex. "Parapente". */
  activity: string;
}

// Route listée dans le pied de page (colonne "Activités") mais dont le contenu
// éditorial reste à écrire — cf. SPEC-footer-linktrip.md §5 : une page vide
// plutôt qu'un lien mort, pour ne pas casser la navigation clavier/SEO.
export function ActivityPlaceholder({ activity }: ActivityPlaceholderProps) {
  return (
    <div className={styles.page}>
      <div className={styles.haloClip}>
        <span className={styles.auraWarm} />
        <span className={styles.auraCool} />
      </div>

      <div className={styles.rail}>
        <Header />

        <main className={cx(styles.main, "flex flex-col items-center justify-center py-4 text-center")}>
          <p className="text-[13px] font-semibold uppercase tracking-[.12em] text-ink-3">Activités</p>
          <h1 className="mt-3 max-w-[16ch] font-display text-[clamp(28px,3.2vw+1vh,46px)] font-bold tracking-[-0.04em] text-ink">
            {activity}
          </h1>
          <p className="mt-4 max-w-[440px] text-[15.5px] leading-[1.55] text-ink-2">
            Cette page est en préparation. Rejoignez la liste d&apos;attente pour être prévenu dès l&apos;ouverture.
          </p>
          <Link
            href="/liste-attente"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[14.5px] font-semibold text-white transition [@media(hover:hover)]:hover:bg-[#2A2438]"
          >
            Rejoindre la liste d&apos;attente <span aria-hidden="true">→</span>
          </Link>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default ActivityPlaceholder;
