"use client";

import { useState } from "react";
import s from "@/app/(marketing)/accueil.module.css";

/* « La prise en main » : trois étapes en accordéon horizontal. L'étape
   ouverte s'élargit et montre un visuel produit. */
const BG = ["#F7F8FA", "#CDEEEE", "#FFEDC2"];

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="11" fill="#191D24" />
      <path d="M7.5 12.3l3 3 6-6.3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Bar({ w, src }: { w: number; src: string }) {
  return (
    <div className={s.upRow}>
      <span className={s.upThumb} style={{ backgroundImage: `url(${src})` }} />
      <span className={s.bar} style={{ flex: 1 }}>
        <i style={{ width: `${w}%` }} />
      </span>
    </div>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Créez votre compte",
    short: "Votre page, vos prix, votre logo.",
    long: "Choisissez vos prix à la photo et au pack, ajoutez votre logo : votre page de vente est prête en quelques minutes.",
    vis: (
      <div className={s.stepMock}>
        <strong style={{ fontSize: 13 }}>Votre page</strong>
        <div className={s.brandRow}>
          <span className={s.logoBox} style={{ width: 40, height: 40 }}>
            LOGO
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "#6B7380", fontSize: 11 }}>Nom affiché</span>
            <strong>Votre structure</strong>
          </span>
        </div>
        <div className={s.priceRow}>
          <span>Photo à l’unité</span>
          <strong>6,00 €</strong>
        </div>
        <div className={s.priceRow}>
          <span>Toutes les photos</span>
          <strong>30,00 €</strong>
        </div>
        <span className={s.miniBtn}>Enregistrer</span>
      </div>
    ),
  },
  {
    n: "02",
    title: "Connectez Stripe",
    short: "Pour recevoir vos ventes sur votre compte bancaire.",
    long: "Vérifiez votre identité et ajoutez votre IBAN une seule fois. Chaque vente arrive ensuite directement sur votre compte.",
    vis: (
      <div className={s.stepMock}>
        <strong style={{ fontSize: 13 }}>Recevoir vos ventes</strong>
        <div className={s.okRow}>
          <Check />
          Identité vérifiée
        </div>
        <div className={s.okRow}>
          <Check />
          Compte bancaire ajouté
        </div>
        <div className={s.okRow} style={{ background: "#F7F8FA", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={s.ring} />
            Activer les paiements
          </span>
          <span style={{ color: "#6B7380" }}>›</span>
        </div>
        <span className={s.miniBtn}>Connecter Stripe</span>
      </div>
    ),
  },
  {
    n: "03",
    title: "Déposez votre première sortie",
    short: "Les liens partent seuls à vos clients.",
    long: "Glissez les photos depuis votre téléphone ou votre ordinateur. Chaque client reçoit son lien par e-mail ou SMS.",
    vis: (
      <div className={s.stepMock}>
        <strong style={{ fontSize: 13 }}>Rafting · samedi 10 h</strong>
        <div className={s.drop} style={{ height: 54, borderWidth: 1.5 }}>
          Glissez les photos de la sortie
        </div>
        <Bar w={100} src="/landing-payfit/r-1.webp" />
        <Bar w={62} src="/landing-payfit/r-3.webp" />
        <div className={s.sent}>
          <span>12 liens envoyés aux clients</span>
          <strong>✓</strong>
        </div>
      </div>
    ),
  },
];

export function Steps() {
  const [open, setOpen] = useState(0);
  const cols = STEPS.map((_, i) => (i === open ? "2.2fr" : "1fr")).join(" ");

  return (
    <div className={s.steps} style={{ gridTemplateColumns: cols }}>
      {STEPS.map((st, i) => {
        const on = i === open;
        return (
          <div
            key={st.n}
            role="button"
            tabIndex={0}
            aria-expanded={on}
            className={`${s.step} ${on ? s.stepOpen : s.stepClosed}`}
            style={{ background: BG[i] }}
            onClick={() => setOpen(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen(i);
              }
            }}
          >
            <span className={s.stepBody}>
              <span className={s.stepNum}>{st.n}</span>
              <strong>{st.title}</strong>
              <span>{on ? st.long : st.short}</span>
              {!on && (
                <span className={s.plus} aria-hidden="true">
                  +
                </span>
              )}
            </span>
            {on && (
              <span className={s.stepVis} aria-hidden="true">
                {st.vis}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
