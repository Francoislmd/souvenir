import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { AuthSplit } from "./AuthAside";
import styles from "./auth.module.css";

/**
 * Le cadre des écrans de compte (connexion, mot de passe oublié,
 * réinitialisation). Depuis le 25/10/2026, à la Payfit : le logo en haut à
 * gauche, le formulaire centré sur fond blanc, sans carte, les liens
 * d'information juste dessous ; à droite, le panneau pêche (AuthAside).
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthSplit variant="connexion">
      <div className={styles.auth}>
        <header className={styles.top}>
          <Link href="/" className={styles.logoLink} aria-label="Linktrip, accueil">
            <Logo height={28} title={null} />
          </Link>
        </header>

        <main className={styles.mid}>
          <div className={styles.card}>
            {children}
            <nav className={styles.footNav} aria-label="Informations">
              <Link href="/confidentialite">Politique de confidentialité</Link>
              <Link href="/cgu">Conditions</Link>
              <a href="mailto:hello@linktrip.co">Aide</a>
            </nav>
          </div>
        </main>
      </div>
    </AuthSplit>
  );
}
