import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { BrandPanel } from "./BrandPanel";
import styles from "./auth.module.css";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.auth}>
      <div className={styles.side}>
        <div>
          <Logo height={34} />
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

      <BrandPanel
        quote="Chaque sortie devient une galerie. Chaque client, la sienne."
        subquote="Déposez vos photos, Linktrip les trie et les envoie. Vous gardez 80 % de chaque vente."
      />
    </div>
  );
}
