import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import styles from "./auth.module.css";

/**
 * Le cadre des écrans de compte (connexion, mot de passe oublié,
 * réinitialisation) : le formulaire à gauche, une vraie photo de sortie à
 * droite. Sur téléphone, la photo devient un bandeau en haut, logo dessus.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.auth}>
      <div className={styles.side}>
        <div className={styles.top}>
          <Link href="/" className={styles.logoLink} aria-label="Linktrip, accueil">
            <Logo height={30} title={null} />
          </Link>
        </div>
        <div className={styles.sideIn}>
          <div className={styles.box}>{children}</div>
        </div>
        <div className={styles.legal}>
          En continuant, vous acceptez les <Link href="/cgu">conditions</Link> et la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
          <br />
          Un souci&nbsp;? <a href="mailto:hello@linktrip.co">Écrivez-nous</a>.
        </div>
      </div>

      <div className={styles.photoCol}>
        <div className={styles.photoCard}>
          <Image src="/landing/immersive/rafting-eaux-vives.webp" alt="" fill priority sizes="(max-width: 900px) 100vw, 50vw" className={styles.photo} />
          <div className={styles.veil} aria-hidden="true" />
          <Link href="/" className={styles.photoLogo} aria-label="Linktrip, accueil">
            <Logo height={26} tone="white" title={null} />
          </Link>
          <p className={styles.photoLine}>Vos sorties vous attendent.</p>
        </div>
      </div>
    </div>
  );
}
