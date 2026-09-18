import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

/**
 * Le cadre des écrans de compte (connexion, mot de passe oublié,
 * réinitialisation). Piste « sobre » de docs/maquette-connexion-v1.html,
 * retenue le 18/09/2026 : la page d'un outil, pas d'un site. Fond papier,
 * une carte blanche séparée par un filet, un pied de page réduit à une
 * barre ; aucune image, aucun slogan.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.auth}>
      <header className={styles.top}>
        <Link href="/" className={styles.logoLink} aria-label="Linktrip, accueil">
          <Logo height={28} title={null} />
        </Link>
        <Link href="/signup" className={styles.topLink}>
          Créer un compte
        </Link>
      </header>

      <main className={styles.mid}>
        <div className={styles.card}>{children}</div>
      </main>

      <footer className={styles.foot}>
        <span>© {new Date().getFullYear()} Linktrip</span>
        <nav className={styles.footNav} aria-label="Informations">
          <Link href="/cgu">Conditions</Link>
          <Link href="/confidentialite">Confidentialité</Link>
          <a href="mailto:hello@linktrip.co">Aide</a>
        </nav>
      </footer>
    </div>
  );
}
