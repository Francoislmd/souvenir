"use client";

import { ButtonLink } from "@/components/ui/Button";
import { gtmEvent } from "@/lib/gtm";

/* Seul fragment client de la FAQ : le reste de la section est statique et rendu
   côté serveur. Il n'existe ici que pour instrumenter le clic, ButtonLink étant
   un lien Next classique qui ne peut pas recevoir de handler depuis un Server
   Component. */
export function FaqCta({ className }: { className?: string }) {
  return (
    <ButtonLink
      href="/liste-attente"
      variant="sunset"
      size="md"
      className={className}
      onClick={() => gtmEvent("cta_click", { cta_id: "faq", cta_location: "accueil" })}
    >
      Rejoindre la liste d&rsquo;attente <span aria-hidden="true">→</span>
    </ButtonLink>
  );
}

export default FaqCta;
