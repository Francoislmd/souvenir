import Link from "next/link";
import styles from "@/app/(marketing)/landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

interface FooterProps {
  /** "accueil" : trois liens à droite (+ Simulation, mobile uniquement). "default" : simple mention. */
  variant?: "accueil" | "default";
}

const linkClass = "[@media(hover:hover)]:hover:text-ink transition";

export function Footer({ variant = "default" }: FooterProps) {
  if (variant === "accueil") {
    return (
      <footer className={styles.footer}>
        <div className="flex flex-wrap justify-center gap-7 text-sm text-ink-3 min-[1000px]:ml-auto min-[1000px]:justify-start">
          <Link href="/fonctionnement" className={linkClass}>
            Fonctionnement
          </Link>
          {/* Masqué en desktop : déjà dans la nav du header là où elle reste visible (§ header). */}
          <Link href="/simulation" className={cx(linkClass, "min-[1000px]:hidden")}>
            Simulation
          </Link>
          <Link href="/confidentialite" className={linkClass}>
            Confidentialité
          </Link>
          <a href="mailto:hello@linktrip.co" className={linkClass}>
            Nous écrire
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      {/* Le header masque "Fonctionnement"/"Simulation" sous 1000px (pas de menu
          burger) : le pied de page les reprend, empilés, centrés. */}
      <nav className={cx(styles.footerNavMobile, "text-sm text-ink-3")}>
        <Link href="/fonctionnement" className={linkClass}>
          Fonctionnement
        </Link>
        <Link href="/simulation" className={linkClass}>
          Simulation
        </Link>
      </nav>
      <span className="text-[13.5px] text-ink-3">Sans matériel ni&nbsp;abonnement.</span>
    </footer>
  );
}

export default Footer;
