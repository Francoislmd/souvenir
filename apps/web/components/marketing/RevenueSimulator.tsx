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
      <span className="lp-eyebrow text-sm">
        Simulateur de revenus
      </span>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "#161320" }}>
        Combien pouvez-vous<br />gagner par mois&nbsp;?
      </h2>
      <p className="mt-3 text-sm" style={{ color: "#726C80" }}>
        Basé sur {Math.round(CONVERSION * 100)}&nbsp;% de taux d&apos;achat · {PRICE}&nbsp;€ par pack
      </p>

      {/* Slider */}
      <div className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm font-medium" style={{ color: "#726C80" }}>Clients par mois</span>
          <span className="font-display text-3xl font-extrabold tabular-nums" style={{ color: "#161320" }}>{clients}</span>
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
            background: `linear-gradient(to right, #FF5A1F ${pct}%, #EEEBF0 ${pct}%)`,
          }}
        />
        <div className="mt-1.5 flex justify-between text-[11px]" style={{ color: "#A6A0B2" }}>
          <span>{MIN}</span>
          <span>{MAX} clients</span>
        </div>
      </div>

      {/* Carte résultat — dégradé sunset */}
      <div className="mt-8 rounded-[20px] px-8 py-8" style={{ background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)" }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
          CA mensuel estimé
        </p>
        <p
          className="mt-3 font-display font-extrabold tabular-nums text-white"
          style={{ fontSize: "clamp(3rem, 8vw, 4.5rem)", lineHeight: 1 }}
        >
          {ca.toLocaleString("fr-FR")}&thinsp;<span style={{ fontSize: "55%" }}>€</span>
        </p>
        <p className="mt-3 text-sm tabular-nums text-white/80">
          {sales} ventes · {PRICE}&nbsp;€&nbsp;/ pack
        </p>
      </div>
    </div>
  );
}
