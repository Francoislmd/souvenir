"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Chaque photo a sa propre durée d'upload (ms) — elles se complètent dans le désordre
const PHOTOS = [
  { src: "/hero-surf.jpg",        ms: 950  },
  { src: "/hero-canyoning.jpg",   ms: 1700 },
  { src: "/hero-rafting.jpg",     ms: 620  },
  { src: "/hero-paragliding.jpg", ms: 2050 },
  { src: "/hero-jetski.jpg",      ms: 1250 },
  { src: "/hero-canyoning.jpg",   ms: 1050 },
];
const MAX_MS = Math.max(...PHOTOS.map(p => p.ms));

export function UploadAnimation() {
  const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
  const barRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timers  = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() { timers.current.forEach(clearTimeout); timers.current = []; }

  useEffect(() => {
    function cycle() {
      clearTimers();
      setDoneSet(new Set());

      // Reset barres immédiatement (sans transition)
      barRefs.current.forEach(el => {
        if (!el) return;
        el.style.transition = "none";
        el.style.width = "0%";
      });

      // Démarrer le remplissage après une courte pause
      const t0 = setTimeout(() => {
        barRefs.current.forEach((el, i) => {
          if (!el) return;
          void el.getBoundingClientRect(); // force reflow
          el.style.transition = `width ${PHOTOS[i].ms}ms ease`;
          el.style.width = "100%";
        });

        // Marquer chaque photo comme terminée quand sa barre est pleine
        PHOTOS.forEach((p, i) => {
          timers.current.push(
            setTimeout(() => setDoneSet(prev => { const s = new Set(prev); s.add(i); return s; }), p.ms + 60)
          );
        });

        // Boucle après le hold
        timers.current.push(setTimeout(cycle, MAX_MS + 60 + 1800));
      }, 450);

      timers.current.push(t0);
    }

    timers.current.push(setTimeout(cycle, 400));
    return clearTimers;
  }, []);

  const allDone = doneSet.size >= PHOTOS.length;

  return (
    <div className="overflow-hidden rounded-card border border-border bg-canvas p-5">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full transition-all duration-500"
            style={{ background: allDone ? "#EAF7EE" : "var(--accent-tint)" }}
          >
            <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5"
              stroke={allDone ? "#16A34A" : "var(--brand)"}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            >
              {allDone
                ? <path d="M2 6l3 3 5-5" />
                : <path d="M6 9V3M3.5 5.5 6 3l2.5 2.5" />
              }
            </svg>
          </div>
          <span className="text-sm font-semibold text-ink">
            {allDone ? "Envoi terminé" : "Envoi en cours"}
          </span>
        </div>
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{ color: doneSet.size > 0 ? "#16A34A" : "var(--muted)" }}
        >
          {doneSet.size} / 6 envoyées
        </span>
      </div>

      {/* Grille — toutes les photos toujours visibles */}
      <div className="grid grid-cols-3 gap-2">
        {PHOTOS.map((photo, i) => {
          const done = doneSet.has(i);
          return (
            <div key={i} className="relative aspect-square overflow-hidden rounded-[10px]">
              <Image src={photo.src} fill className="object-cover" alt="" sizes="120px" />

              {/* Barre de progression */}
              <div
                className="absolute inset-x-0 bottom-0 px-1.5 pb-1.5"
                style={{ opacity: done ? 0 : 1, transition: "opacity 0.35s ease" }}
              >
                <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/25">
                  <div
                    ref={el => { barRefs.current[i] = el; }}
                    className="h-full rounded-full bg-brand"
                    style={{ width: "0%" }}
                  />
                </div>
              </div>

              {/* Badge checkmark à la complétion */}
              <div
                className="absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-white shadow-sm"
                style={{
                  opacity:   done ? 1 : 0,
                  transform: done ? "scale(1)" : "scale(0.4)",
                  transition: "opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <svg viewBox="0 0 10 10" fill="none" className="h-2.5 w-2.5">
                  <path d="M1.5 5l2.5 2.5 4.5-4" stroke="#16A34A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
