import { createClient } from "@/lib/supabase-server";
import { ReinitialiserForm } from "./ReinitialiserForm";
import styles from "@/components/auth/auth.module.css";

export default async function ReinitialiserPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className={styles.head}>
        <h1>Lien invalide</h1>
        <p className={styles.lead}>
          Ce lien de réinitialisation a expiré ou a déjà été utilisé.{" "}
          <a href="/mot-de-passe-oublie">Demandez-en un nouveau</a>.
        </p>
      </div>
    );
  }

  return <ReinitialiserForm />;
}
