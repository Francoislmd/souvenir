"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { LogoMark } from "@/components/brand/Logo";

const PHOTOS = [
  "/hero-paragliding.jpg",
  "/hero-surf.jpg",
  "/hero-canyoning.jpg",
  "/hero-rafting.jpg",
  "/hero-jetski.jpg",
  "/hero-surf.jpg",
];

// 0=locked · 1=tapping · 2=flash · 3=unlocking · 4=unlocked
const DURATIONS = [2600, 550, 480, 900, 2000];

export function PhoneMockup({ className = "" }: { className?: string }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function tick(p: number) {
      const next = (p + 1) % DURATIONS.length;
      timer = setTimeout(() => { setPhase(next); tick(next); }, DURATIONS[p]);
    }
    timer = setTimeout(() => { setPhase(0); tick(0); }, 500);
    return () => clearTimeout(timer);
  }, []);

  const tapping   = phase === 1;
  const flashing  = phase === 2;
  const unlocking = phase === 3;
  const unlocked  = phase === 4;
  const locked    = !unlocking && !unlocked;

  return (
    <div className={`w-[260px] rounded-[2.25rem] border-[6px] border-ink bg-white p-3 shadow-2xl sm:w-[280px] ${className}`}>

      {/* Header */}
      <div className="flex items-center gap-2.5 px-1 pb-3">
        <LogoMark className="h-8 w-8 shrink-0" />
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-ink">Vol Passion Annecy</span>
          <span className="text-[11px] text-ink-2">Le vol de Léa 🤩 · Annecy</span>
        </div>
      </div>

      {/* Photo grid + overlay */}
      <div className="relative overflow-hidden rounded-[12px]">
        <div className="grid grid-cols-3 gap-0.5">
          {PHOTOS.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden">
              <Image
                src={src} fill className="object-cover" alt="" sizes="80px"
                style={{
                  filter:     unlocked ? "blur(0px)"  : "blur(7px)",
                  transform:  unlocked ? "scale(1)"   : "scale(1.12)",
                  transition: `filter 0.55s ease ${i * 55}ms, transform 0.55s ease ${i * 55}ms`,
                }}
              />
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{
            opacity:    locked ? 1 : 0,
            transition: "opacity 0.4s ease",
          }}
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-[2px]"
            style={{
              background:  "rgba(0,0,0,0.32)",
              transform:   tapping ? "scale(0.82)" : "scale(1)",
              transition:  "transform 0.18s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
              <rect x="5" y="11" width="14" height="9" rx="2" fill="currentColor" opacity="0.9" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[11px] font-semibold text-white" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
            14 photos · 2 vidéos
          </span>
        </div>

        {/* Flash au moment du paiement */}
        {flashing && (
          <div className="animate-unlock-flash pointer-events-none absolute inset-0 bg-white" />
        )}

        {/* Checkmark pop à la fin */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            opacity:   unlocking ? 1 : 0,
            transform: unlocking ? "scale(1)" : "scale(0.4)",
            transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
              <path d="M4 12l5 5L20 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-3">
        {unlocked ? (
          <div
            className="flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-500"
            style={{ background: "#EAF7EE" }}
          >
            <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0">
              <path d="M2.5 7l3 3L11.5 4" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex-1 text-xs font-semibold" style={{ color: "#16A34A" }}>
              Photos débloquées !
            </span>
            <span className="text-[11px] font-medium" style={{ color: "#16A34A", opacity: 0.65 }}>
              Télécharger
            </span>
          </div>
        ) : (
          <div
            className="flex items-center justify-between rounded-full px-4 py-2.5 text-xs font-semibold text-white transition-all duration-200"
            style={{
              background: "var(--brand)",
              transform:  tapping ? "scale(0.96)" : "scale(1)",
              boxShadow:  tapping
                ? "none"
                : "0 4px 18px rgba(79,70,229,0.35)",
            }}
          >
            <span>{tapping ? "Paiement…" : "Débloquer mes souvenirs"}</span>
            {!tapping && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px]">29 €</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
