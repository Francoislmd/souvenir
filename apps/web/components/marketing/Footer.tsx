import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import styles from "@/app/(marketing)/landing.module.css";

interface FooterProps {
  /** "accueil" : trois liens à droite. "fonctionnement" : CTA + mention. "default" : simple mention, rien à gauche. */
  variant?: "accueil" | "fonctionnement" | "default";
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

  if (variant === "fonctionnement") {
    return (
      <footer className={styles.footer}>
        <ButtonLink href="/" variant="dark" size="md">
          Ouvrir ma boutique <span aria-hidden="true">→</span>
        </ButtonLink>
        <span className="text-[13.5px] text-ink-3">Sans matériel ni&nbsp;abonnement.&nbsp;🇪🇺</span>
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
