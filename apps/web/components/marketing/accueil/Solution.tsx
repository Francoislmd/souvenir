"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/app/(marketing)/accueil.module.css";
import { Arrow } from "./AccueilHeader";
import { Locked } from "./Locked";

/* Bloc « La solution » : un onglet par type de structure, trois lignes
   d'accordéon, et un visuel produit par ligne (envoi, prix, ventes).
   Les prix et chiffres sont des exemples de démonstration. */
const PROFILES = [
  {
    tab: "Moniteur indépendant",
    title: "Vous encadrez seul ? Vendez sans y passer vos soirées.",
    items: [
      ["Une sortie, un lien par client", "Vous déposez le soir, chaque client reçoit le lien de ses photos par e-mail ou SMS."],
      ["Vos prix et votre page", "À l’unité ou en pack, avec votre nom et votre logo sur chaque galerie."],
      ["Vos ventes suivies sortie par sortie", "Vous voyez qui a payé et ce qui arrive sur votre compte, sans tableur."],
    ],
    visTitle: "Sortie rafting",
    visMeta: "3 départs",
    brand: "Votre nom",
    prices: ["6,00 €", "30,00 €", "12,00 €"],
    sales: [
      ["Rafting · sam. 10 h", "12 clients", "96 €"],
      ["Rafting · sam. 14 h", "9 clients", "72 €"],
      ["Rafting · dim. 10 h", "14 clients", "120 €"],
      ["Rafting · dim. 14 h", "8 clients", "48 €"],
    ],
    total: "269 €",
  },
  {
    tab: "Base ou club",
    title: "Plusieurs moniteurs, une seule boutique.",
    items: [
      ["Chaque moniteur dépose ses photos", "Les photos arrivent dans la bonne sortie, quel que soit le moniteur."],
      ["Une page aux couleurs du club", "Votre logo, vos prix, vos activités, au même endroit."],
      ["Toutes les ventes du club", "Le chiffre de chaque sortie, réuni sur un seul compte."],
    ],
    visTitle: "Club · sortie du samedi",
    visMeta: "4 moniteurs",
    brand: "Votre club",
    prices: ["5,00 €", "25,00 €", "10,00 €"],
    sales: [
      ["Kayak · sam. 9 h", "18 clients", "110 €"],
      ["Paddle · sam. 11 h", "10 clients", "60 €"],
      ["Kayak · dim. 9 h", "22 clients", "145 €"],
      ["Voile · dim. 14 h", "6 clients", "40 €"],
    ],
    total: "284 €",
  },
  {
    tab: "Centre d’activités",
    title: "Des dizaines de départs par jour, sans tri à la main.",
    items: [
      ["Photos triées par départ", "Chaque créneau a sa galerie, chaque client retrouve la sienne."],
      ["Plusieurs activités, une seule page", "Rafting, canyoning, paddle : chaque activité a ses prix."],
      ["Les ventes de la journée en un coup d’œil", "Par créneau et par activité, dès le soir."],
    ],
    visTitle: "Centre · départ 10 h",
    visMeta: "18 départs aujourd’hui",
    brand: "Votre centre",
    prices: ["6,00 €", "29,00 €", "15,00 €"],
    sales: [
      ["Rafting · 10 h", "24 clients", "198 €"],
      ["Canyoning · 11 h", "12 clients", "116 €"],
      ["Rafting · 14 h", "22 clients", "174 €"],
      ["Paddle · 16 h", "9 clients", "54 €"],
    ],
    total: "433 €",
  },
] as const;

const GRID = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/landing-payfit/r-${n}.webp`);

export function Solution() {
  const [tab, setTab] = useState(0);
  const [item, setItem] = useState(0);
  const p = PROFILES[tab];

  return (
    <>
      <div className={s.tabs} role="tablist" aria-label="Type de structure">
        {PROFILES.map((x, i) => (
          <button
            key={x.tab}
            type="button"
            role="tab"
            aria-selected={i === tab}
            className={s.tab}
            onClick={() => {
              setTab(i);
              setItem(0);
            }}
          >
            {x.tab}
          </button>
        ))}
      </div>

      <div className={s.solution} role="tabpanel">
        <div>
          <strong className={s.solTitle}>{p.title}</strong>
          {p.items.map(([t, txt], i) => (
            <button key={t} type="button" className={s.accItem} aria-expanded={i === item} onClick={() => setItem(i)}>
              <span className={s.accHead}>
                {t}
                <span className={s.accSign} aria-hidden="true">
                  {i === item ? "–" : "+"}
                </span>
              </span>
              {i === item && <span className={s.accText}>{txt}</span>}
            </button>
          ))}
          <div className={s.solCta}>
            <Link href="/signup" className={`${s.btn} ${s.primary}`}>
              Créer un compte gratuit
              <Arrow />
            </Link>
          </div>
        </div>

        <div aria-hidden="true">
          {item === 0 && (
            <div className={s.visCard}>
              <div className={s.visHead}>
                <strong>{p.visTitle}</strong>
                <span>{p.visMeta}</span>
              </div>
              <div className={s.gallery4}>
                {GRID.map((src) => (
                  <Locked key={src} src={src} />
                ))}
              </div>
              <div className={s.visFoot}>
                <span>12 clients · liens envoyés</span>
                <strong>Lien envoyé ✓</strong>
              </div>
            </div>
          )}
          {item === 1 && (
            <div className={s.visCard}>
              <div className={s.visHead}>
                <strong>Votre page</strong>
                <span>{p.visMeta}</span>
              </div>
              <div className={s.brandRow}>
                <span className={s.logoBox}>LOGO</span>
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ color: "#6B7380", fontSize: 12 }}>Nom affiché</span>
                  <strong style={{ fontSize: 15 }}>{p.brand}</strong>
                </span>
              </div>
              {[
                ["Photo à l’unité", p.prices[0]],
                ["Toutes les photos", p.prices[1]],
                ["Vidéo de la sortie", p.prices[2]],
              ].map(([l, v]) => (
                <div key={l} className={s.priceRow}>
                  <span>{l}</span>
                  <strong>{v}</strong>
                </div>
              ))}
              <span className={s.miniBtn}>Enregistrer</span>
            </div>
          )}
          {item === 2 && (
            <div className={s.visCard}>
              <div className={s.visHead}>
                <strong>Vos ventes</strong>
                <span>Cette semaine</span>
              </div>
              <div>
                {p.sales.map(([a, b, c]) => (
                  <div key={a} className={s.saleRow}>
                    <span>{a}</span>
                    <span>{b}</span>
                    <strong>{c}</strong>
                  </div>
                ))}
              </div>
              <div className={s.total}>
                <span>Versé sur votre compte</span>
                <strong>{p.total}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
