"use client";

import { useEffect, useState } from "react";

export function StickyMobileBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 520);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`mobile-sticky-bar${show ? " show" : ""}`}>
      <div className="mobile-sticky-bar__text">
        <div className="mobile-sticky-bar__t1">Créez votre boutique</div>
        <div className="mobile-sticky-bar__t2">Gratuit pour démarrer</div>
      </div>
      <a href="/signup" className="mobile-sticky-bar__cta">
        Démarrer
      </a>
    </div>
  );
}
