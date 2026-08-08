import Link from "next/link";
import styles from "@/app/(marketing)/landing.module.css";

interface FooterProps {
  /** "accueil" : trois liens à droite. "default" : simple mention, rien à gauche. */
  variant?: "accueil" | "default";
}

export function Footer({ variant = "default" }: FooterProps) {
  if (variant === "accueil") {
    return (
      <footer className={styles.footer}>
        <div className="ml-auto flex gap-7 text-sm text-ink-3">
          <Link href="/fonctionnement" className="hover:text-ink transition">
            Fonctionnement
          </Link>
          <Link href="/confidentialite" className="hover:text-ink transition">
            Confidentialité
          </Link>
          <a href="mailto:hello@linktrip.co" className="hover:text-ink transition">
            Nous écrire
          </a>
        </div>
      </footer>
    );
  }

  return (
    <footer className={styles.footer}>
      <span className="text-[13.5px] text-ink-3">Sans matériel ni&nbsp;abonnement.&nbsp;🇪🇺</span>
    </footer>
  );
}

export default Footer;
