"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const CLIENTS = [
  { name: "Léa M.",  count: 7, srcs: ["/hero-paragliding.jpg", "/hero-surf.jpg", "/hero-canyoning.jpg", "/hero-rafting.jpg"] },
  { name: "Tom D.",  count: 6, srcs: ["/hero-rafting.jpg",     "/hero-jetski.jpg", "/hero-surf.jpg",     "/hero-paragliding.jpg"] },
  { name: "Emma P.", count: 5, srcs: ["/hero-canyoning.jpg",   "/hero-paragliding.jpg", "/hero-surf.jpg", "/hero-jetski.jpg"] },
];

// Phases : 0 = reset/vide · 1 = row 0 · 2 = row 1 · 3 = row 2 · 4 = done · 5 = hold
const DURATIONS = [500, 500, 500, 500, 450, 2200];

export function DistributionAnimation() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick(p: number) {
      const next = (p + 1) % DURATIONS.length;
      timer = setTimeout(() => { setPhase(next); tick(next); }, DURATIONS[p]);
    }
    timer = setTimeout(() => { setPhase(1); tick(1); }, 600);
    return () => clearTimeout(timer);
  }, []);

  const done      = phase >= 4;
  const resetting = phase === 0;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-canvas p-5">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Rotation 14h</p>
          <p className="mt-0.5 text-xs text-muted">18 photos importées · 3 clients</p>
        </div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500"
          style={{
            background: done ? "#EAF7EE" : "var(--border)",
            transform: done ? "scale(1)" : "scale(0.75)",
            opacity: done ? 1 : 0.5,
          }}
        >
          <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5"
            stroke={done ? "#16A34A" : "#A89C90"} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M2 6l3 3 5-5" />
          </svg>
        </div>
      </div>

      {/* Client rows */}
      <div className="mb-3 space-y-2">
        {CLIENTS.map((client, rowIdx) => {
          const ready = phase > rowIdx;
          return (
            <div key={client.name}
              className="flex items-center gap-3 rounded-[12px] border bg-surface px-3 py-2.5 transition-colors duration-300"
              style={{ borderColor: ready && !resetting ? "var(--border)" : "var(--border)" }}
            >
              {/* Avatar + nom */}
              <div className="flex w-20 shrink-0 items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[10px] font-bold text-brand">
                  {client.name[0]}
                </div>
                <span className="truncate text-xs font-semibold text-ink">{client.name}</span>
              </div>

              {/* Photos */}
              <div className="flex flex-1 gap-1">
                {client.srcs.map((src, i) => (
                  <div key={i} className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[5px]">
                    {/* Placeholder gris */}
                    <div className="absolute inset-0 bg-border" />
                    {/* Photo — slide-in */}
                    <div
                      className="absolute inset-0"
                      style={{
                        opacity: ready ? 1 : 0,
                        transform: resetting
                          ? "translateX(0)"
                          : ready ? "translateX(0)" : "translateX(-10px)",
                        transition: resetting
                          ? "opacity 0.22s ease"
                          : `opacity 0.32s ease ${i * 100}ms, transform 0.32s ease ${i * 100}ms`,
                      }}
                    >
                      <Image src={src} fill className="object-cover" alt="" sizes="36px" />
                      {i === 3 && client.count > 4 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-[9px] font-bold text-white">+{client.count - 4}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <span className="shrink-0 text-[10px] text-muted">{client.count} photos</span>
            </div>
          );
        })}
      </div>

      {/* Bouton envoi */}
      <div
        className="rounded-[10px] px-4 py-2.5 text-center transition-all duration-500"
        style={{
          background: done ? "var(--brand)" : "rgba(79,70,229,0.28)",
          boxShadow: done ? "0 4px 20px rgba(79,70,229,0.32)" : "none",
          transform: done ? "scale(1.015)" : "scale(1)",
        }}
      >
        <span className="text-sm font-bold text-white">Envoyer à tout le monde →</span>
      </div>

    </div>
  );
}
