"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SoonPill } from "@/components/ui/SoonPill";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};
const GAP = 16;

const GRADIENTS = [
  "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)",
  "linear-gradient(135deg,#FF8A1F,#FFB443)",
  "linear-gradient(135deg,#FF3D6E,#8B5CF6)",
  "linear-gradient(135deg,#FF5A1F,#FF3D6E)",
  "linear-gradient(135deg,#FFC24B,#FF9A1F)",
  "linear-gradient(135deg,#12C7BE,#0FA9C9)",
  "linear-gradient(135deg,#8B5CF6,#FF3D6E)",
  "linear-gradient(135deg,#12C7BE,#0FA9C9)",
];

type Card = {
  title: string;
  desc: string;
  tag: string;
  price?: string;
  soon?: boolean;
  icon: JSX.Element;
};

const CARDS: Card[] = [
  {
    title: "Photos & vidéos",
    desc: "La galerie HD de la sortie, achetée en deux clics.",
    tag: "Revenu direct",
    price: "~20–30 €",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <circle cx="12" cy="12.5" r="3.2" />
        <path d="M8 6l1.5-2h5L16 6" />
      </svg>
    ),
  },
  {
    title: "Tirages & posters",
    desc: "Bientôt : impression à la demande en Europe, livrée chez le client. Zéro stock.",
    tag: "Revenu direct",
    price: "~45 €",
    soon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <rect x="4" y="3" width="16" height="18" rx="1.5" />
        <rect x="8" y="7" width="8" height="8" rx="1" />
        <path d="M8 18h8" />
      </svg>
    ),
  },
  {
    title: "Merch à votre marque",
    desc: "Bientôt : t-shirts, casquettes et sweats à votre logo, à la demande.",
    tag: "Revenu direct",
    price: "~60 € +",
    soon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <path d="M8 3l-5 4 2.5 3L8 8.5V21h8V8.5L18.5 10 21 7l-5-4-2 2h-4z" />
      </svg>
    ),
  },
  {
    title: "Autres activités",
    desc: "Bientôt : proposez vos autres prestations au moment de l'euphorie.",
    tag: "Revenu direct",
    price: "Gros ticket",
    soon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5l-2 5-5 2 2-5z" />
      </svg>
    ),
  },
  {
    title: "Avis Google",
    desc: "Demandé au pic émotionnel, quand le client est le plus satisfait.",
    tag: "Réputation",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M12 2l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.9 6.6 20l1-6.1L3.2 9.5l6.1-.9z" />
      </svg>
    ),
  },
  {
    title: "Parrainage",
    desc: "Bientôt : code de réduction intégré à chaque galerie partagée à un proche.",
    tag: "Acquisition",
    soon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7S9 2 6.5 3.5 12 7 12 7zM12 7s3-5 5.5-3.5S12 7 12 7z" />
      </svg>
    ),
  },
  {
    title: "Réseaux sociaux",
    desc: "Chaque partage tague votre marque et vous fait connaître.",
    tag: "Visibilité",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1.2" fill="#fff" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Relances",
    desc: "Bientôt : relance automatique pour faire revenir le client la saison suivante.",
    tag: "Fidélité",
    soon: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.7">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
];

export function LeviersCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [perView, setPerView] = useState(3);
  const [translate, setTranslate] = useState(0);
  const [reduced, setReduced] = useState(false);
  const drag = useRef<{ startX: number; active: boolean }>({ startX: 0, active: false });

  const maxIndex = Math.max(0, CARDS.length - perView);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // responsive cards-per-view
  useEffect(() => {
    function compute() {
      const w = viewportRef.current?.clientWidth ?? window.innerWidth;
      setPerView(w < 560 ? 1 : w < 900 ? 2 : 3);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  useEffect(() => {
    setIndex((i) => Math.min(i, maxIndex));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perView]);

  // measure pixel offset for the current index (gap-aware)
  useLayoutEffect(() => {
    const slide = trackRef.current?.firstElementChild as HTMLElement | null;
    if (!slide) return;
    setTranslate(index * (slide.getBoundingClientRect().width + GAP));
  }, [index, perView]);

  // autoplay, paused by hover/focus (via onMouseEnter/onFocus handlers) and reduced motion
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(() => {
      setIndex((i) => (i >= maxIndex ? 0 : i + 1));
    }, 4200);
    return () => clearInterval(id);
  }, [maxIndex, reduced, paused]);

  function go(i: number) {
    setIndex(Math.max(0, Math.min(i, maxIndex)));
  }

  return (
    <div
      className="reveal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: 20 }}>
        <button
          type="button"
          aria-label="Levier précédent"
          onClick={() => go(index - 1)}
          disabled={index <= 0}
          style={navBtnStyle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Levier suivant"
          onClick={() => go(index + 1)}
          disabled={index >= maxIndex}
          style={navBtnStyle}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div
        ref={viewportRef}
        role="region"
        aria-roledescription="carrousel"
        aria-label="Leviers de revenus"
        tabIndex={0}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(index - 1);
          if (e.key === "ArrowRight") go(index + 1);
        }}
        style={{ overflow: "hidden", outline: "none" }}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: GAP,
            transform: `translateX(-${translate}px)`,
            transition: reduced ? "none" : "transform .55s cubic-bezier(.2,.7,.2,1)",
            touchAction: "pan-y",
            willChange: "transform",
          }}
          onPointerDown={(e) => {
            drag.current = { startX: e.clientX, active: true };
          }}
          onPointerUp={(e) => {
            if (!drag.current.active) return;
            const delta = e.clientX - drag.current.startX;
            drag.current.active = false;
            const slide = trackRef.current?.firstElementChild as HTMLElement | null;
            const threshold = slide ? slide.getBoundingClientRect().width * 0.22 : 60;
            if (delta > threshold) go(index - 1);
            else if (delta < -threshold) go(index + 1);
          }}
        >
          {CARDS.map((c, i) => (
            <div
              key={c.title}
              style={{ flex: `0 0 calc((100% - ${(perView - 1) * GAP}px) / ${perView})` }}
            >
              <LevierCard card={c} index={i} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 30 }}>
        {Array.from({ length: maxIndex + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Aller au groupe ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
            style={{
              width: i === index ? 24 : 8,
              height: 8,
              borderRadius: 100,
              border: "none",
              padding: 0,
              cursor: "pointer",
              background: i === index ? "#FF5A1F" : "rgba(22,19,32,.16)",
              transition: "width .25s, background .25s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "1px solid rgba(22,19,32,.12)",
  background: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#161320",
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(22,19,32,.06)",
};

function LevierCard({ card, index }: { card: Card; index: number }) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #EEEBF0",
        borderRadius: 18,
        padding: 26,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        boxShadow: "0 6px 20px rgba(22,19,32,.05)",
        opacity: card.soon ? 0.82 : 1,
      }}
    >
      <span
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          background: card.soon ? "rgba(22,19,32,.14)" : GRADIENTS[index],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {card.icon}
      </span>
      <h4 style={{ ...D, fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", margin: 0, color: "#161320" }}>
        {card.title}
      </h4>
      <p style={{ fontSize: 13.5, lineHeight: 1.45, color: "#726C80", margin: 0, flex: 1 }}>
        {card.desc}
      </p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            padding: "5px 12px",
            borderRadius: 100,
            background: "#FFF1EB",
            color: "#E8460C",
            whiteSpace: "nowrap",
          }}
        >
          {card.price ?? card.tag}
        </span>
        {card.soon ? (
          <SoonPill />
        ) : (
          card.price && (
            <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "#A6A0B2" }}>
              {card.tag}
            </span>
          )
        )}
      </div>
    </div>
  );
}
