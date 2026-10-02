import { redirect } from "next/navigation";
import { publicStorePath } from "@/lib/store";

// L'ancienne page de retrait publique. Le retrait se fait désormais depuis la
// galerie privée (/g/{jeton}/retrait) : on renvoie à la boutique, qui envoie
// le lien de cette galerie.
export default function LegacyWithdrawPage({ params }: { params: { slug: string } }) {
  redirect(publicStorePath(params.slug));
}
