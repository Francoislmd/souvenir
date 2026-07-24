import { requireOperatorUser } from "@/lib/current-user";
import { ReglagesForm } from "@/components/reglages/ReglagesForm";
import { readAutomations } from "@/lib/automations";
import styles from "@/app/(operator)/operator.module.css";

export default async function ReglagesPage() {
  const dbUser = await requireOperatorUser();
  const { operator } = dbUser;

  return (
    <section className={styles.view}>
      <h1 className={styles.h1}>Réglages</h1>
      <p className={styles.lead}>Ce que vos clients voient, ce qu&rsquo;ils paient, ce qu&rsquo;on leur renvoie.</p>
      <ReglagesForm
        operator={{
          name: operator.name,
          brandColor: operator.brandColor,
          pricePhotoCents: operator.pricePhotoCents,
          pricePackCents: operator.pricePackCents,
          priceAllCents: operator.priceAllCents,
          packSize: operator.packSize,
          feePercent: operator.feePercent,
          stripeOnboarded: operator.stripeOnboarded,
          activities: operator.activities,
          automations: readAutomations(operator.automations),
        }}
      />
    </section>
  );
}
