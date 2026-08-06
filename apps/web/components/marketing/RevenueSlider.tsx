"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/(marketing)/landing.module.css";
import { trackEvent } from "@/lib/marketing-analytics";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const eur = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} €`;

interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
}

const SLIDERS: SliderConfig[] = [
  { id: "sorties", label: "Sorties par mois", min: 4, max: 200, step: 2, format: (v) => `${v}` },
  { id: "participants", label: "Participants par sortie", min: 1, max: 25, step: 1, format: (v) => `${v}` },
  { id: "taux", label: "Part qui achète", min: 5, max: 60, step: 1, format: (v) => `${v} %` },
  { id: "prix", label: "Prix du pack HD", min: 5, max: 60, step: 1, format: (v) => `${v} €` },
];

const DEFAULTS: Record<string, number> = { sorties: 40, participants: 6, taux: 25, prix: 20 };

export function RevenueSlider() {
  const [values, setValues] = useState(DEFAULTS);
  const hasInteracted = useRef(false);
  const latestValues = useRef(values);
  latestValues.current = values;

  useEffect(() => {
    function sendFinalValues() {
      trackEvent("sim_values", latestValues.current);
    }
    document.addEventListener("visibilitychange", sendFinalValues);
    window.addEventListener("pagehide", sendFinalValues);
    return () => {
      document.removeEventListener("visibilitychange", sendFinalValues);
      window.removeEventListener("pagehide", sendFinalValues);
    };
  }, []);

  function handleChange(id: string, value: number) {
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      trackEvent("sim_interact");
    }
    setValues((v) => ({ ...v, [id]: value }));
  }

  const ca = values.sorties * values.participants * (values.taux / 100) * values.prix;
  const net = ca * 0.8;
  const saison = net * 6;

  return (
    <>
      <div className="mx-auto w-full max-w-[880px] rounded-[clamp(18px,1.6vw,26px)] border border-line bg-white px-[clamp(20px,2.4vw,38px)] py-[clamp(20px,3vh,34px)] shadow-[0_30px_60px_-34px_rgba(22,19,32,0.34)]">
        <div className="grid grid-cols-1 gap-x-[clamp(22px,3vw,44px)] gap-y-[clamp(14px,2vh,22px)] sm:grid-cols-2">
          {SLIDERS.map((s) => {
            const value = values[s.id]!;
            const pct = ((value - s.min) / (s.max - s.min)) * 100;
            return (
              <div key={s.id}>
                <div className="mb-2 flex items-baseline justify-between text-[13.5px] text-ink-2">
                  <label htmlFor={`sim-${s.id}`}>{s.label}</label>
                  <b className="font-display text-[15.5px] font-bold tracking-tight text-ink">{s.format(value)}</b>
                </div>
                <input
                  id={`sim-${s.id}`}
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={value}
                  onChange={(e) => handleChange(s.id, Number(e.target.value))}
                  className={styles.range}
                  style={{ background: `linear-gradient(to right, var(--brand) ${pct}%, var(--line) ${pct}%)` }}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-[clamp(18px,2.8vh,30px)] flex flex-wrap items-end gap-5 border-t border-line pt-[clamp(16px,2.4vh,26px)]">
          <div>
            <div className="text-[13.5px] text-ink-3">Ce que vous encaissez, par mois</div>
            <div className={cx(styles.gradText, "mt-1 font-display text-[clamp(38px,3vw+1.4vh,68px)] font-bold leading-none tracking-tight")}>
              {eur(net)}
            </div>
          </div>
          <div className="ml-auto text-right">
            <span className="block text-[12.5px] text-ink-3">Sur une saison de 6 mois</span>
            <b className="font-display text-[clamp(18px,1vw+0.6vh,24px)] font-bold tracking-tight text-ink">{eur(saison)}</b>
          </div>
        </div>

        <p className="mt-[clamp(10px,1.6vh,16px)] text-center text-xs text-ink-4">
          Estimation indicative. Le taux d&apos;achat varie selon l&apos;activité et reste à valider sur la vôtre.
        </p>
      </div>

      <p className="mx-auto mt-[clamp(12px,2vh,20px)] max-w-[880px] text-center text-[clamp(13.5px,0.45vw+0.5vh,15px)] text-ink-2">
        Commission de <b className={cx(styles.gradText, "font-display font-bold tracking-tight")}>20 %</b> sur les
        ventes. Pas d&apos;abonnement, pas d&apos;engagement.
      </p>
    </>
  );
}

export default RevenueSlider;
