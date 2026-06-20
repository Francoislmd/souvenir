"use client";
import { useState } from "react";

const PRICE = 29;
const CONVERSION = 0.3;
const MIN = 20;
const MAX = 300;

export function RevenueSimulator() {
  const [clients, setClients] = useState(80);

  const sales = Math.round(clients * CONVERSION);
  const ca = sales * PRICE;
  const pct = Math.round(((clients - MIN) / (MAX - MIN)) * 100);

  return (
    <div>
      <span className="text-sm font-semibold uppercase tracking-wide text-brand">
        Simulateur de revenus
      </span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Combien pouvez-vous<br />gagner par mois&nbsp;?
      </h2>
      <p className="mt-3 text-sm text-ink-2">
        Basé sur {Math.round(CONVERSION * 100)}&nbsp;% de taux d&apos;achat · {PRICE}&nbsp;€ par pack
      </p>

      {/* Slider */}
      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-medium text-ink-2">Clients par mois</span>
          <span className="font-display text-3xl font-extrabold tabular-nums text-ink">{clients}</span>
        </div>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={5}
          value={clients}
          onChange={(e) => setClients(Number(e.target.value))}
          className="simulator-range-light"
          style={{
            background: `linear-gradient(to right, var(--brand) ${pct}%, var(--border) ${pct}%)`,
          }}
        />
        <div className="mt-1.5 flex justify-between text-[11px] text-muted">
          <span>{MIN}</span>
          <span>{MAX} clients</span>
        </div>
      </div>

      {/* Carte résultat — dark */}
      <div className="mt-8 rounded-[20px] bg-ink px-8 py-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
          CA mensuel estimé
        </p>
        <p
          className="mt-3 font-display font-extrabold tabular-nums text-white"
          style={{ fontSize: "clamp(3rem, 8vw, 4.5rem)", lineHeight: 1 }}
        >
          {ca.toLocaleString("fr-FR")}&thinsp;<span style={{ fontSize: "55%" }}>€</span>
        </p>
        <p className="mt-3 text-sm tabular-nums text-white/40">
          {sales} ventes · {PRICE}&nbsp;€&nbsp;/ pack
        </p>
      </div>
    </div>
  );
}
