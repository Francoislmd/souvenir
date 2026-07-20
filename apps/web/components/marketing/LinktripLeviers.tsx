"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/linktrip.module.css";
import { SoonPill } from "@/components/ui/SoonPill";

type Card = {
  title: string;
  desc: string;
  tag: string;
  grow?: boolean;
  fam: string;
  gradient: keyof typeof GRAD;
  soon?: boolean;
  icon: JSX.Element;
};

const GRAD = {
  g1: styles.g1, g2: styles.g2, g3: styles.g3, g4: styles.g4,
  g5: styles.g5, g6: styles.g6, g7: styles.g7, g8: styles.g8,
};

const CARDS: Card[] = [
  {
    title: "Photos & vidéos", desc: "La galerie HD de la sortie, achetée en deux clics.",
    tag: "~20 €", fam: "Revenu direct", gradient: "g1",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="6" width="18" height="13" rx="2" /><circle cx="12" cy="12.5" r="3.2" /><path d="M8 6l1.5-2h5L16 6" /></svg>,
  },
  {
    title: "Tirages & posters", desc: "Bientôt : impression à la demande en Europe, livrée chez le client. Zéro stock.",
    tag: "~45 €", fam: "Revenu direct", gradient: "g2", soon: true,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="3" width="16" height="18" rx="1.5" /><rect x="8" y="7" width="8" height="8" rx="1" /><path d="M8 18h8" /></svg>,
  },
  {
    title: "Merch à votre marque", desc: "Bientôt : t-shirts, casquettes et sweats à votre logo, à la demande.",
    tag: "~60 €+", fam: "Revenu direct", gradient: "g3", soon: true,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 3l-5 4 2.5 3L8 8.5V21h8V8.5L18.5 10 21 7l-5-4-2 2h-4z" /></svg>,
  },
  {
    title: "Autres activités", desc: "Bientôt : cross-sell de vos autres prestations, au moment de l'euphorie.",
    tag: "Gros ticket", fam: "Revenu direct", gradient: "g4", soon: true,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.5l-2 5-5 2 2-5z" /></svg>,
  },
  {
    title: "Avis Google", desc: "Demandé au pic émotionnel, quand le client est le plus satisfait.",
    tag: "Réputation", grow: true, fam: "Croissance", gradient: "g5",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"><path d="M12 2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.9 6.6 20l1-6.1L3.2 9.5l6.1-.9z" /></svg>,
  },
  {
    title: "Parrainage", desc: "Bientôt : code de réduction intégré à chaque galerie partagée à un proche.",
    tag: "Acquisition", grow: true, fam: "Croissance", gradient: "g6", soon: true,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7S9 2 6.5 3.5 12 7 12 7zM12 7s3-5 5.5-3.5S12 7 12 7z" /></svg>,
  },
  {
    title: "Réseaux sociaux", desc: "Chaque partage tague votre marque et vous fait connaître.",
    tag: "Visibilité", grow: true, fam: "Croissance", gradient: "g7",
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" /></svg>,
  },
  {
    title: "Relances", desc: "Bientôt : relance automatique pour faire revenir le client la saison suivante.",
    tag: "Fidélité", grow: true, fam: "Croissance", gradient: "g8", soon: true,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>,
  },
];

const GAP = 16;

export function LinktripLeviers() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [index, setIndexState] = useState(0);
  const [dotsCount, setDotsCount] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedRef = useRef(false);

  function perView() {
    if (typeof window === "undefined") return 3;
    const w = wrapRef.current?.clientWidth ?? window.innerWidth;
    return w < 560 ? 1 : w < 900 ? 2 : 3;
  }
  function maxIndex() {
    return Math.max(0, CARDS.length - perView());
  }
  function step() {
    const slide = trackRef.current?.firstElementChild as HTMLElement | null;
    return (slide?.getBoundingClientRect().width ?? 0) + GAP;
  }
  function render(i: number, animate = true) {
    if (trackRef.current) {
      trackRef.current.style.transition = animate ? "" : "none";
      trackRef.current.style.transform = `translateX(-${i * step()}px)`;
    }
  }
  function go(i: number) {
    const clamped = Math.max(0, Math.min(i, maxIndex()));
    indexRef.current = clamped;
    setIndexState(clamped);
    render(clamped);
  }
  function stop() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }
  function start() {
    stop();
    if (!reducedRef.current) {
      timerRef.current = setInterval(() => {
        go(indexRef.current >= maxIndex() ? 0 : indexRef.current + 1);
      }, 3800);
    }
  }

  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDotsCount(maxIndex() + 1);
    render(indexRef.current, false);
    start();

    function onResize() {
      setDotsCount(maxIndex() + 1);
      go(Math.min(indexRef.current, maxIndex()));
    }
    let rt: ReturnType<typeof setTimeout>;
    const debounced = () => {
      clearTimeout(rt);
      rt = setTimeout(onResize, 150);
    };
    window.addEventListener("resize", debounced);
    return () => {
      window.removeEventListener("resize", debounced);
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drag = useRef<{ x0: number; dx: number; active: boolean }>({ x0: 0, dx: 0, active: false });

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { x0: e.clientX, dx: 0, active: true };
    if (trackRef.current) trackRef.current.style.transition = "none";
    stop();
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    drag.current.dx = e.clientX - drag.current.x0;
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(${-indexRef.current * step() + drag.current.dx}px)`;
    }
  }
  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    if (trackRef.current) trackRef.current.style.transition = "";
    const dx = drag.current.dx;
    if (Math.abs(dx) > step() * 0.22) go(indexRef.current + (dx < 0 ? 1 : -1));
    else render(indexRef.current);
    start();
  }

  return (
    <div className={styles.levWrap} ref={wrapRef} onMouseEnter={stop} onMouseLeave={start}>
      <div className={styles.levHeadNav}>
        <button type="button" className={styles.levNav} aria-label="Précédent" disabled={index <= 0} onClick={() => { go(index - 1); start(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <button type="button" className={styles.levNav} aria-label="Suivant" disabled={index >= maxIndex()} onClick={() => { go(index + 1); start(); }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>
      <div className={styles.levViewport}>
        <div
          className={styles.levTrack}
          ref={trackRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {CARDS.map((c) => (
            <div key={c.title} className={styles.levSlide}>
              <div className={styles.levCard}>
                <span className={`${styles.levIc} ${GRAD[c.gradient]}`}>{c.icon}</span>
                <h4>{c.title}</h4>
                <p>{c.desc}</p>
                <div className={styles.levFoot}>
                  <span className={`${styles.levTag} ${c.grow ? styles.levTagGrow : ""}`}>{c.tag}</span>
                  {c.soon ? <SoonPill /> : <span className={styles.levFam}>{c.fam}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.levDots}>
        {Array.from({ length: dotsCount }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Aller au groupe ${i + 1}`}
            className={i === index ? styles.active : ""}
            onClick={() => { go(i); start(); }}
          />
        ))}
      </div>
    </div>
  );
}
