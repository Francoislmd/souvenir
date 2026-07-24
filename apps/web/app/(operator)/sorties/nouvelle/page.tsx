import Link from "next/link";
import styles from "@/app/(operator)/operator.module.css";
import { NewSortieForm } from "@/components/sorties/NewSortieForm";
import { requireOperatorUser } from "@/lib/current-user";
import { ACTIVITIES } from "@/lib/onboarding/activities";

export default async function NouvelleSortiePage() {
  const dbUser = await requireOperatorUser();
  const selectedIds = new Set(dbUser.operator.activities);
  // Repli sur le catalogue complet si l'opérateur n'a encore rien sélectionné
  // (compte créé avant l'ajout de ce champ, ou étape d'onboarding sautée).
  const activities = (selectedIds.size > 0 ? ACTIVITIES.filter((a) => selectedIds.has(a.id)) : ACTIVITIES).map(
    (a) => a.label,
  );

  return (
    <section className={styles.view}>
      <Link href="/sorties" className={styles.back}>
        ← Sorties
      </Link>
      <h1 className={styles.h1}>Nouvelle sortie</h1>
      <p className={styles.lead}>Notez la sortie maintenant, les photos viendront après.</p>
      <NewSortieForm activities={activities} />
    </section>
  );
}
