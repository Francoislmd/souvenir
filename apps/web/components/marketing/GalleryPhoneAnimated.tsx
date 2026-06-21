"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

const GRID_SRCS = ["/hero-rafting.jpg", "/hero-surf.jpg", "/hero-canyoning.jpg"];

// 0=locked · 1=tapping · 2=flash · 3=unlocking · 4=unlocked
const DURATIONS = [2600, 500, 420, 850, 2000];

export function GalleryPhoneAnimated({ className = "" }: { className?: string }) {
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
    <div className={`relative ${className}`} style={{ width: 218, height: 447 }}>
      {/* Body */}
      <div
        className="absolute inset-0 rounded-[38px]"
        style={{
          background: "linear-gradient(155deg, #2E2E30 0%, #1C1C1E 55%)",
          boxShadow: "0 48px 96px -16px rgba(0,0,0,0.55), 14px 24px 48px -12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      />
      <div className="absolute inset-x-3 top-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }} />
      {([
        { side: "right", top: 90,  h: 50 },
        { side: "left",  top: 78,  h: 28 },
        { side: "left",  top: 116, h: 54 },
        { side: "left",  top: 180, h: 54 },
      ] as const).map(({ side, top, h }, i) => (
        <div key={i} className={`absolute ${side === "right" ? "-right-[3px] rounded-r-full" : "-left-[3px] rounded-l-full"}`}
          style={{ top, height: h, width: 3, background: "linear-gradient(180deg, #3A3A3C, #2A2A2C)" }} />
      ))}

      {/* Screen */}
      <div className="absolute inset-[3px] overflow-hidden rounded-[35px] bg-[#FAF7F4]">
        <div className="pointer-events-none absolute inset-0 z-30 rounded-[35px]" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%)" }} />

        {/* Status bar */}
        <div className="relative flex h-9 items-center justify-between bg-[#FAF7F4] px-4 pt-1">
          <span className="text-[9px] font-semibold text-[#1F1B17]">17:34</span>
          <div className="absolute left-1/2 top-2 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-[#1C1C1E]" />
          <svg viewBox="0 0 28 9" className="h-2 w-5 fill-[#1F1B17]">
            <rect x="0" y="5" width="3" height="4" rx="0.5" />
            <rect x="4.5" y="3" width="3" height="6" rx="0.5" />
            <rect x="9" y="1" width="3" height="8" rx="0.5" />
            <rect x="13.5" y="0" width="3" height="9" rx="0.5" opacity="0.25" />
            <rect x="21" y="0" width="7" height="7" rx="1.5" fill="none" stroke="#1F1B17" strokeWidth="1" />
            <rect x="22" y="1.5" width="4" height="4" rx="0.8" />
          </svg>
        </div>

        {/* Operator header */}
        <div className="flex items-center gap-2 px-3 pb-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4F46E5]">
            <span className="text-[8px] font-bold text-white">VP</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-[#1F1B17]">Vol Passion Annecy</p>
            <p className="text-[7.5px] text-[#A89C90]">Annecy · 14 juin · 14 photos</p>
          </div>
        </div>

        {/* Hero photo */}
        <div className="relative mx-2.5 overflow-hidden rounded-[12px]" style={{ height: 198 }}>
          <Image
            src="/hero-paragliding.jpg" fill className="object-cover" alt="" sizes="194px"
            style={{
              filter:    unlocked ? "blur(0px)"  : "blur(8px)",
              transform: unlocked ? "scale(1)"   : "scale(1.1)",
              transition: "filter 0.6s ease, transform 0.6s ease",
            }}
          />

          {/* Lock overlay */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/38"
            style={{ opacity: locked ? 1 : 0, transition: "opacity 0.4s ease" }}
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/25"
              style={{ transform: tapping ? "scale(0.85)" : "scale(1)", transition: "transform 0.2s ease" }}
            >
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 18, height: 18 }} className="text-white">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[9.5px] font-semibold text-white">14 photos · 2 vidéos</p>
          </div>

          {/* Checkmark pop on unlock */}
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              opacity:   unlocking ? 1 : 0,
              transform: unlocking ? "scale(1)" : "scale(0.3)",
              transition: "opacity 0.35s ease, transform 0.35s cubic-bezier(0.34,1.56,0.64,1)",
            }}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-xl">
              <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
                <path d="M4 10l4 4L16 6" stroke="#16A34A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Payment flash */}
          {flashing && <div className="animate-unlock-flash pointer-events-none absolute inset-0 bg-white" />}
        </div>

        {/* Grid */}
        <div className="mx-2.5 mt-[3px] grid grid-cols-3 gap-[2px]">
          {GRID_SRCS.map((src, i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-[5px]">
              <Image src={src} fill className="object-cover" alt="" sizes="60px"
                style={{
                  filter:    unlocked ? "blur(0px)" : "blur(5px)",
                  transform: unlocked ? "scale(1)"  : "scale(1.08)",
                  transition: `filter 0.55s ease ${i * 80}ms, transform 0.55s ease ${i * 80}ms`,
                }}
              />
              {!unlocked && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/35"
                  style={{ opacity: locked ? 1 : 0, transition: "opacity 0.4s ease" }}
                >
                  <svg viewBox="0 0 10 12" fill="none" className="h-2.5 w-2" stroke="white" strokeWidth="1.2" strokeLinecap="round">
                    <rect x="1" y="5" width="8" height="6.5" rx="1" />
                    <path d="M3 5V3.5a2 2 0 0 1 4 0V5" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mx-2.5 mt-2">
          {unlocked ? (
            <div
              className="flex items-center gap-1.5 rounded-full px-3 py-2"
              style={{
                background: "#16A34A",
                transform: unlocked ? "scale(1)" : "scale(0.85)",
                transition: "transform 0.4s cubic-bezier(0.34,1.56,0.64,1)",
              }}
            >
              <div
                style={{
                  transform: unlocked ? "scale(1) rotate(0deg)" : "scale(0) rotate(-90deg)",
                  transition: "transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.05s",
                }}
              >
                <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3 shrink-0">
                  <path d="M2 6l2.5 2.5L10 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="flex-1 text-[10px] font-bold text-white">Photos débloquées !</span>
              <div className="flex items-center gap-0.5">
                <svg viewBox="0 0 12 12" fill="none" className="h-2.5 w-2.5">
                  <path d="M6 1v7M3 6l3 3 3-3M2 11h8" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-[9px] font-semibold text-white/80">Zip</span>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center gap-2 rounded-full py-2.5 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)",
                transform:  tapping ? "scale(0.96)" : "scale(1)",
                boxShadow:  tapping ? "none" : "0 4px 14px rgba(79,70,229,0.38)",
              }}
            >
              <span className="text-[11px] font-bold text-white">{tapping ? "Paiement…" : "Débloquer"}</span>
              {!tapping && <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">29 €</span>}
            </div>
          )}
        </div>

        {/* Souvenir footer */}
        <div className="mb-1 mt-2 flex items-center justify-center gap-1 opacity-40">
          <svg viewBox="0 0 10 12" fill="none" style={{ width: 8, height: 10 }}>
            <rect x="1" y="1" width="8" height="10" rx="1.5" stroke="#1F1B17" strokeWidth="1.2" />
            <rect x="2.5" y="3.5" width="5" height="3.5" rx="0.8" fill="#4F46E5" />
          </svg>
          <span className="text-[7.5px] font-semibold tracking-wide text-[#1F1B17]">via Souvenir</span>
        </div>
      </div>
    </div>
  );
}
