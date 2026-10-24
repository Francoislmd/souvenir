"use client";

import { useState } from "react";
import Link from "next/link";
import s from "@/app/(marketing)/accueil.module.css";
import { Arrow } from "./AccueilHeader";

/* Simulateur de revenus. Hypothèses (mêmes que l'ancien RevenueSimulator) :
   commission Linktrip de 20 %, frais Stripe de 1,5 % + 0,25 € par paiement,
   un paiement par client acheteur. */
const COMMISSION = 0.2;
const STRIPE_RATE = 0.015;
const STRIPE_FIXED = 0.25;

const eur = (v: number) => `${Math.round(v).toLocaleString("fr-FR")} €`;

export function Simulator() {
  const [clients, setClients] = useState(200);
  const [rate, setRate] = useState(25);
  const [basket, setBasket] = useState(20);

  const buyers = Math.round((clients * rate) / 100);
  const gross = buyers * basket;
  const net = gross - gross * COMMISSION - buyers * (basket * STRIPE_RATE + STRIPE_FIXED);

  const fields = [
    { id: "sim-clients", label: "Clients par mois", value: clients, shown: `${clients}`, min: 20, max: 1000, step: 10, set: setClients },
    { id: "sim-rate", label: "Clients qui achètent", value: rate, shown: `${rate} %`, min: 5, max: 80, step: 5, set: setRate },
    { id: "sim-basket", label: "Panier moyen", value: basket, shown: eur(basket), min: 5, max: 60, step: 1, set: setBasket },
  ];

  return (
    <div className={s.sim}>
      <div className={s.simInputs}>
        {fields.map((f) => (
          <div key={f.id} className={s.field}>
            <div className={s.fieldHead}>
              <label htmlFor={f.id}>{f.label}</label>
              <span>{f.shown}</span>
            </div>
            <input
              id={f.id}
              className={s.range}
              type="range"
              min={f.min}
              max={f.max}
              step={f.step}
              value={f.value}
              onChange={(e) => f.set(Number(e.target.value))}
            />
          </div>
        ))}
      </div>
      <div className={s.simResult}>
        <span className={s.simLabel}>Vous gagnez chaque mois</span>
        <strong className={s.simNet} aria-live="polite">
          {eur(Math.max(0, net))}
        </strong>
        <span className={s.simDetail}>
          {buyers} clients acheteurs × {eur(basket)} = {eur(gross)} de ventes
        </span>
        <div className={s.simFoot}>
          <div>
            <span className={s.simNote}>Estimation indicative : commission Linktrip de 20 % et frais Stripe (1,5 % + 0,25 € par paiement) déduits.</span>
            <Link href="/signup" className={`${s.btn} ${s.white}`}>
              Créer un compte gratuit
              <Arrow />
            </Link>
          </div>
          <svg width="52" height="46" viewBox="0 0 52 46" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={s.doodle}>
            <ellipse cx="22" cy="30" rx="14" ry="5" />
            <path d="M8 30v6c0 2.8 6.3 5 14 5s14-2.2 14-5v-6" />
            <ellipse cx="26" cy="18" rx="14" ry="5" />
            <path d="M12 18v6c0 2.8 6.3 5 14 5s14-2.2 14-5v-6" />
            <path d="M44 6l2-3M48 11l3-1" />
          </svg>
        </div>
      </div>
    </div>
  );
}
