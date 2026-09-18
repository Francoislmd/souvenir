import { redirect } from "next/navigation";

// L'ancien formulaire à deux champs, où atterrissait le lien de confirmation
// d'e-mail : tout passe désormais par /signup, qui reprend à la bonne étape.
export default function OnboardingPage() {
  redirect("/signup");
}
