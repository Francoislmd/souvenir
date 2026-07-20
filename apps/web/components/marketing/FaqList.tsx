"use client";
import { useState } from "react";

const FAQ_ITEMS = [
  {
    q: "Faut-il du matériel ou une application ?",
    a: "Non. Vos guides photographient comme d'habitude. Linktrip s'occupe du reste.",
  },
  {
    q: "Comment êtes-vous rémunérés ?",
    a: "Une commission sur les ventes, rien d'autre. Pas d'abonnement, pas d'engagement. Une galerie qui ne vend pas ne coûte rien.",
  },
  {
    q: "Comment le client retrouve-t-il ses photos ?",
    a: "Il reçoit un lien par email ou SMS et ouvre sa galerie directement dans son navigateur. Les photos sont triées automatiquement : chacun retrouve les siennes. Zéro inscription, zéro téléchargement.",
  },
  {
    q: "Combien de temps pour être opérationnel ?",
    a: "Une après-midi. Vous réglez votre marque et vos tarifs, puis vous publiez votre première galerie le jour même.",
  },
  {
    q: "À qui appartiennent les données clients ?",
    a: "À vous. Hébergement européen, conformité RGPD. Linktrip travaille pour votre structure, pas l'inverse.",
  },
];

export function FaqList() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <dl className="divide-y" style={{ borderColor: "#EEEBF0" }}>
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="reveal py-5" style={{ borderBottom: i < FAQ_ITEMS.length - 1 ? "1px solid #EEEBF0" : "none" }}>
          <dt>
            <button
              className="flex w-full items-center justify-between gap-4 text-left"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              <span className="font-semibold" style={{ color: "#161320" }}>{item.q}</span>
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200"
                style={{
                  border: "1px solid #EEEBF0",
                  background: open === i ? "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)" : "#FAFAFA",
                  color: open === i ? "#fff" : "#726C80",
                  borderColor: open === i ? "transparent" : "#EEEBF0",
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                }}
              >
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3">
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
            </button>
          </dt>
          {open === i && (
            <dd className="mt-3 pr-11 text-sm leading-relaxed" style={{ color: "#726C80" }}>
              {item.a}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
