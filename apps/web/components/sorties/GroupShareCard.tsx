"use client";

import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";
import { GroupShareActions } from "@/components/sorties/GroupShareActions";

export function GroupShareCard({ sortieId, shareUrl }: { sortieId: string; shareUrl: string }) {
  const toast = useToast();
  const shortLabel = shareUrl.replace(/^https?:\/\//, "");

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permission refusée…) —
      // le lien reste visible et sélectionnable à la main dans la carte.
    }
    toast("Lien copié");
  }

  return (
    <>
      <div className={styles.lbl}>Galerie de groupe</div>
      <div className={styles.linkcard}>
        <div className={styles.lt}>Un lien pour tout le monde</div>
        <div className={styles.lh}>Vos clients choisissent leur créneau et retrouvent leurs photos. Vous n&rsquo;avez personne à saisir.</div>
        <div className={styles.linkrow}>
          <code>{shortLabel}</code>
          <button type="button" className={`${styles.btn} ${styles.ghost} ${styles.sm}`} onClick={copyLink}>
            Copier
          </button>
        </div>
        <GroupShareActions sortieId={sortieId} shareUrl={shareUrl} />
      </div>
    </>
  );
}
