"use client";
import { useState } from "react";

const PRICE = 29;
const CONVERSION = 0.3;

export function RevenueSimulator() {
  const [clients, setClients] = useState(80);

  const sales = Math.round(clients * CONVERSION);
  const ca = sales * PRICE;
  const operatorShare = Math.round(ca * 0.8);
  const trackPct = Math.round(((clients - 20) / (300 - 20)) * 100);

  return (
    <div className="text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand">Simulateur de revenus</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        Combien pouvez-vous<br />gagner par mois ?
      </h2>
      <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
        Basé sur 30 % de taux d&apos;achat · 29 € par pack
      </p>

      {/* Slider */}
      <div className="mt-12">
        <div className="mb-4 flex items-baseline justify-between px-1">
          <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
            Clients par mois
          </span>
          <span className="font-display text-3xl font-extrabold text-white">{clients}</span>
        </div>
        <input
          type="range"
          min={20}
          max={300}
          step={5}
          value={clients}
          onChange={(e) => setClients(Number(e.target.value))}
          className="simulator-range"
        />
        <div className="mt-2 flex justify-between" style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>
          <span>20</span>
          <span>300 clients</span>
        </div>
      </div>

      {/* Result */}
      <div
        className="mt-10 rounded-[20px] px-8 py-8"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-start justify-between gap-6">
          <div className="text-left">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              CA mensuel
            </p>
            <p className="mt-1 font-display text-5xl font-extrabold text-white">
              {ca.toLocaleString("fr-FR")}&thinsp;<span className="text-3xl">€</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
              Votre part (80&nbsp;%)
            </p>
            <p className="mt-1 font-display text-5xl font-extrabold text-brand">
              {operatorShare.toLocaleString("fr-FR")}&thinsp;<span className="text-3xl">€</span>
            </p>
          </div>
        </div>

        {/* Bar */}
        <div className="mt-6 h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${trackPct}%`, background: "var(--brand-gradient)" }}
          />
        </div>

        <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          {sales} ventes × {PRICE}&nbsp;€ · split 80&nbsp;/&nbsp;20 avec Souvenir
        </p>
      </div>
    </div>
  );
}
