"use client";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Combien ça coûte ?",
    a: "Rien à payer d'avance. En mode Boutique, Souvenir prend 20 % sur chaque vente (frais Stripe inclus). En mode Marketing, c'est 100 % gratuit — vous offrez les photos, vous encaissez la visibilité.",
  },
  {
    q: "Mes clients doivent-ils créer un compte ou installer une appli ?",
    a: "Non. Le client reçoit un lien par email ou SMS et ouvre sa galerie directement dans son navigateur. Zéro inscription, zéro téléchargement.",
  },
  {
    q: "Est-ce que ça fonctionne avec un mauvais réseau ?",
    a: "Oui. L'upload utilise une file locale persistée dans le navigateur (IndexedDB). Si la connexion coupe en plein upload, les transferts reprennent automatiquement dès que le réseau revient — sans rien faire.",
  },
  {
    q: "Comment fonctionne le paiement ?",
    a: "Via Stripe Connect : quand un client achète son pack HD, Stripe encaisse et transfère votre part (80 %) directement sur votre compte. Pas de délai artificiel, pas d'intermédiaire. La commission Souvenir (20 %) couvre les frais Stripe.",
  },
  {
    q: "Puis-je choisir le prix du pack photo ?",
    a: "Oui. Le prix par défaut est 29 € mais vous pouvez le modifier dans vos réglages. Le mode (Boutique ou Marketing) est aussi paramétrable session par session.",
  },
  {
    q: "Combien de temps mes photos sont-elles stockées ?",
    a: "Les originaux sont conservés 90 jours, les aperçus tant que la galerie est active. Après achat, le client peut télécharger un zip HD. Vous pouvez supprimer une livraison à tout moment.",
  },
  {
    q: "Est-ce conforme au RGPD ?",
    a: "Oui. Les consentements (droit à l'image, email) sont horodatés. Le client peut retirer son consentement depuis sa galerie. Chaque galerie a une page Confidentialité dédiée, et la suppression des données est possible sur demande.",
  },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <dl className="divide-y divide-border">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="reveal py-5">
          <dt>
            <button
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-semibold text-ink">{item.q}</span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-canvas text-ink-2 transition-transform duration-200"
                style={{ transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}
              >
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </dt>
          {open === i && (
            <dd className="mt-3 pr-11 text-sm leading-relaxed text-ink-2">
              {item.a}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
