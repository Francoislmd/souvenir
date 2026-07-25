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
        <div className={styles.lt}>Un lien pour toutes vos sorties de groupe</div>
        <div className={styles.lh}>Le même lien pour chaque sortie — vos clients y choisissent leur jour, puis leur créneau, pour retrouver leurs photos.</div>
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
