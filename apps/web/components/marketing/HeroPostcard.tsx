"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

type Phase = "locked" | "paying" | "unlocked";

const D = { fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif" };

export function HeroPostcard() {
  const [phase, setPhase] = useState<Phase>("locked");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("unlocked");
      return;
    }
    const seq: [Phase, number][] = [
      ["locked", 2400],
      ["paying", 1200],
      ["unlocked", 2800],
    ];
    let i = 0;
    const step = () => {
      const [p, dur] = seq[i % seq.length];
      setPhase(p);
      i++;
      timer.current = setTimeout(step, dur);
    };
    step();
    return () => clearTimeout(timer.current);
  }, []);

  const unlocked = phase === "unlocked";
  const paying = phase === "paying";

  return (
    <div style={{ position: "relative" }}>
      {/* Airmail-framed postcard */}
      <div
        style={{
          background:
            "repeating-linear-gradient(45deg,#FF3D6E 0 11px,#ffffff 11px 22px,#FFB443 22px 33px,#ffffff 33px 44px)",
          padding: 10,
          borderRadius: 8,
          boxShadow: "0 20px 44px rgba(22,19,32,.18)",
          transform: "rotate(-1.4deg)",
        }}
      >
        <div style={{ background: "#ffffff", padding: 10, borderRadius: 3 }}>
          <div style={{ position: "relative", borderRadius: 3, overflow: "hidden", lineHeight: 0 }}>
            {/* Photo */}
            <div
              style={{
                filter: unlocked ? "blur(0px)" : "blur(16px)",
                transform: unlocked ? "scale(1)" : "scale(1.08)",
                transition: "filter 1.3s ease, transform 1.3s ease",
              }}
            >
              <Image
                src="/hero-paragliding.jpg"
                width={540}
                height={440}
                alt="Activité outdoor"
                priority
                style={{ width: "100%", height: 440, objectFit: "cover", display: "block" }}
              />
            </div>

            {/* Dark overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: unlocked
                  ? "rgba(20,32,46,0)"
                  : "linear-gradient(180deg,rgba(20,32,46,.12),rgba(20,32,46,.42))",
                opacity: unlocked ? 0 : 1,
                pointerEvents: "none",
                transition: "opacity 1s ease",
              }}
            >
              {/* Camera icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(20,32,46,.62)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 22px rgba(0,0,0,.34)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    style={{
                      width: 13,
                      height: 11,
                      border: "2px solid #fff",
                      borderBottom: "none",
                      borderRadius: "7px 7px 0 0",
                      marginBottom: -1.5,
                    }}
                  />
                  <div
                    style={{
                      width: 20,
                      height: 15,
                      background: "#fff",
                      borderRadius: 3,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <div style={{ width: 3, height: 6, background: "#1b2733", borderRadius: 2 }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Unlock button */}
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 11,
                whiteSpace: "nowrap",
                background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)",
                color: "#fff",
                padding: paying ? "11px 22px" : "6px 7px 6px 20px",
                borderRadius: 100,
                ...D,
                fontWeight: 700,
                fontSize: 14.5,
                lineHeight: 1,
                boxShadow: "0 8px 20px rgba(255,90,31,.4)",
                opacity: unlocked ? 0 : 1,
                transition: "opacity 0.8s ease",
                pointerEvents: "none",
              }}
            >
              <span>{paying ? "Paiement en cours…" : "Débloquer mes souvenirs"}</span>
              {phase === "locked" && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "rgba(255,255,255,.22)",
                    color: "#fff",
                    padding: "0 13px",
                    height: 28,
                    borderRadius: 100,
                    fontWeight: 800,
                    fontSize: 13.5,
                  }}
                >
                  20 €
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stamp */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -14,
          width: 104,
          height: 120,
          backgroundColor: "#ffffff",
          backgroundImage: "radial-gradient(circle at 0 0,transparent 4px,#ffffff 4px)",
          backgroundSize: "12px 12px",
          padding: 6,
          borderRadius: 2,
          boxShadow: "0 10px 24px rgba(27,39,51,.22)",
          transform: "rotate(5deg)",
          zIndex: 3,
        }}
      >
        <Image
          src="/hero-surf.jpg"
          width={92}
          height={78}
          alt=""
          style={{ width: "100%", height: 78, objectFit: "cover", borderRadius: 1, display: "block" }}
        />
        <div
          style={{
            ...D,
            fontWeight: 700,
            fontSize: 9.5,
            textAlign: "center",
            marginTop: 5,
            letterSpacing: ".04em",
            color: "#161320",
          }}
        >
          LINKTRIP · 2026
        </div>
      </div>

      {/* Postmark (unlocked) */}
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: -18,
          width: 82,
          height: 82,
          borderRadius: "50%",
          border: "2px solid #FF3D6E",
          color: "#E8460C",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: "rotate(-9deg)",
          background: "rgba(255,61,110,.08)",
          zIndex: 5,
          opacity: unlocked ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        <span style={{ ...D, fontWeight: 700, fontSize: 12 }}>PAYÉ</span>
        <span style={{ fontSize: 8, letterSpacing: ".08em", marginTop: 1 }}>+16,00 €</span>
      </div>
    </div>
  );
}
