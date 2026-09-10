import { notFound } from "next/navigation";
import { dateKeyFor } from "@/lib/gallery-group";
import { resolveSortieByCode } from "@/lib/store";
import { StoreScreen } from "@/components/store/StoreScreen";

// Le lien d'une sortie précise, celui du QR code affiché à la fin de la
// journée. Il ouvre la même boutique que le slug seul, mais directement sur
// le jour de cette sortie : le client n'a pas à retrouver sa date dans la
// liste. Le code n'est plus un secret, seulement un raccourci.
export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function StoreSortiePage({ params }: { params: { slug: string; code: string } }) {
  const found = await resolveSortieByCode(params.slug, params.code);
  if (!found) notFound();

  return <StoreScreen operator={found.operator} initialDateKey={dateKeyFor(found.startsAt)} />;
}
