"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "@/app/(marketing)/landing-v2.module.css";

/* Simulateur de revenus du pro. Hypothèses : commission Linktrip de 20 %
   (tarif unique depuis le 25/09/2026) et frais Stripe de 1,5 % + 0,25 € par
   paiement, un paiement par client acheteur. À tenir aligné avec le bloc #tarif. */
const COMMISSION = 0.2;
const STRIPE_RATE = 0.015;
const STRIPE_FIXED = 0.25;

const fmt = (v: number) => Math.round(v).toLocaleString("fr-FR");

export function RevenueSimulator() {
  const [clients, setClients] = useState(200);
  const [rate, setRate] = useState(25);
  const [basket, setBasket] = useState(20);

  const buyers = Math.round((clients * rate) / 100);
  const gross = buyers * basket;
  const costs = gross * COMMISSION + buyers * (basket * STRIPE_RATE + STRIPE_FIXED);
  const net = gross - costs;

  const fields = [
    { id: "sim-clients", label: "Clients par mois", value: clients, shown: `${clients}`, min: 20, max: 1000, step: 10, set: setClients },
    { id: "sim-rate", label: "Clients qui achètent", value: rate, shown: `${rate} %`, min: 5, max: 80, step: 5, set: setRate },
    { id: "sim-basket", label: "Prix des photos", value: basket, shown: `${basket} €`, min: 5, max: 60, step: 1, set: setBasket },
  ];

  return (
    <div className={styles.simRow}>
      <div className={styles.simInputs}>
        {fields.map((f) => (
          <div key={f.id} className={styles.field}>
            <div className={styles.fieldHead}>
              <label htmlFor={f.id}>{f.label}</label>
              <span className={styles.fieldValue}>{f.shown}</span>
            </div>
            <input
              id={f.id}
              className={styles.range}
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

      <div className={styles.simResult}>
        <svg className={styles.simWaves} aria-hidden="true" viewBox="0 0 400 160" preserveAspectRatio="none">
          {[60, 90, 120, 150].map((y) => (
            <path key={y} d={`M0 ${y} C60 ${y - 20} 120 ${y - 20} 200 ${y} S340 ${y + 20} 400 ${y}`} stroke="#FFFFFF" strokeWidth="1.5" fill="none" />
          ))}
        </svg>
        <div>
          <span className={styles.simLabel}>Vous gagnez chaque mois</span>
          <span className={styles.simNet} aria-live="polite">
            {fmt(net)} €
          </span>
        </div>
        <dl className={styles.simDl}>
          <div>
            <dt>Ventes ({buyers} clients)</dt>
            <dd>{fmt(gross)} €</dd>
          </div>
          <div className={styles.costs}>
            <dt>Commission et frais de paiement</dt>
            <dd>− {fmt(costs)} €</dd>
          </div>
        </dl>
        <Link href="/signup" className={`${styles.btn} ${styles.white} ${styles.block}`}>
          Créer un compte gratuit
        </Link>
      </div>
    </div>
  );
}
