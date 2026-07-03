"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

const D = { fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif" };

export function Nav() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const check = () => {
      const y = window.scrollY ?? document.documentElement.scrollTop ?? 0;
      el.classList.toggle("nav-scrolled", y > 50);
    };

    check();
    // double listener : window + document couvre tous les cas de scroll container
    window.addEventListener("scroll", check, { passive: true });
    document.addEventListener("scroll", check, { passive: true });
    return () => {
      window.removeEventListener("scroll", check);
      document.removeEventListener("scroll", check);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="lp-nav-wrapper">
      <div className="lp-nav">
        <Link
          href="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#1b2733" }}
        >
          <span
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "2px solid #1b2733",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              ...D,
              flexShrink: 0,
            }}
          >
            S
          </span>
          <span style={{ ...D, fontWeight: 700, fontSize: 23, letterSpacing: "-.01em" }}>Souvenir</span>
        </Link>

        <div className="lp-nav-links">
          <a href="#comment-ca-marche" style={{ textDecoration: "none", color: "#1b2733" }}>
            Fonctionnalités
          </a>
          <a href="#cas-usage" style={{ textDecoration: "none", color: "#1b2733" }}>
            Cas d&apos;usage
          </a>
          <a href="#tarifs" style={{ textDecoration: "none", color: "#1b2733" }}>
            Tarifs
          </a>
          <a href="/login" style={{ textDecoration: "none", color: "#1b2733", opacity: 0.6 }}>
            Se connecter
          </a>
          <a
            href="/signup"
            style={{
              background: "#2f5fd0",
              color: "#fff",
              padding: "11px 22px",
              borderRadius: 100,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            Démarrer gratuitement
          </a>
        </div>

        <a
          href="/signup"
          className="lp-nav-cta-mobile"
          style={{
            background: "#2f5fd0",
            color: "#fff",
            padding: "9px 18px",
            borderRadius: 100,
            fontWeight: 600,
            textDecoration: "none",
            fontSize: 13,
            alignItems: "center",
          }}
        >
          Démarrer gratuitement
        </a>
      </div>
    </div>
  );
}
