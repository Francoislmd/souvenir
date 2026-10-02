import { notFound } from "next/navigation";
import { resolveOperator } from "@/lib/store";
import { LinkRequest } from "@/components/store/LinkRequest";
import styles from "@/components/gallery/collective.module.css";

// L'adresse de la boutique : store.linktrip.co/{slug}. Elle ne montre plus
// aucune photo. Le client donne l'adresse e-mail de sa réservation et reçoit
// le lien de sa galerie privée.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const found = await resolveOperator(params.slug);
  return {
    title: found ? `Vos photos · ${found.name}` : "Vos photos",
    robots: { index: false, follow: false },
  };
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const operator = await resolveOperator(params.slug);
  if (!operator) notFound();

  return (
    <div className={styles.page} style={{ "--op": operator.brandColor } as React.CSSProperties}>
      <LinkRequest
        slug={operator.slug}
        operator={operator}
        place={operator.tagline}
        heading="Retrouvez vos photos"
      />
    </div>
  );
}
