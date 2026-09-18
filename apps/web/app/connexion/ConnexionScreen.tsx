"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { EmailCodeForm } from "@/components/onboarding/EmailCodeForm";
import styles from "@/components/onboarding/onboarding.module.css";

/*
 * Se reconnecter, c'est le premier écran de l'inscription avec un autre
 * titre : le même code par e-mail, la même colonne. L'ancien écran (mot de
 * passe, « Rester connecté », panneau dégradé et fausses vignettes) ne
 * pouvait de toute façon plus servir : un compte créé par code n'a pas de
 * mot de passe.
 */
export function ConnexionScreen() {
  const router = useRouter();
  return (
    <div className={`${styles.ob} ${styles.centered}`}>
      <header className={styles.head}>
        <Link href="/" className={styles.logo} aria-label="Linktrip, accueil">
          <Logo height={28} />
        </Link>
        <Link href="/signup" className={styles.login}>
          Créer un compte
        </Link>
      </header>
      <EmailCodeForm
        title="Connexion."
        lede="Nous vous envoyons un code par e-mail pour retrouver vos sorties."
        onSignedIn={() => {
          router.push("/sorties");
          router.refresh();
        }}
      />
      <p className={styles.help}>
        Un souci pour vous connecter&nbsp;? <a href="mailto:hello@linktrip.co">Écrivez-nous</a>.
      </p>
    </div>
  );
}
