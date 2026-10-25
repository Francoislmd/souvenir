"use client";

import { useEffect } from "react";
import s from "@/app/(marketing)/accueil.module.css";

/* Apparition au défilement : les blocs sous la ligne de flottaison montent
   en fondu quand ils entrent à l'écran ; les cartes d'une même grille
   arrivent l'une après l'autre. Rien ne bouge si l'utilisateur a demandé
   moins d'animations, ni pour ce qui est déjà visible au chargement. */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const groups = [s.row2, s.row3, s.cols3, s.faqList, s.steps].map((c) => `.${c}`).join(",");
    const blocks = Array.from(document.querySelectorAll<HTMLElement>(`main .${s.sec} .${s.wrap} > *, main .${s.join}`));
    const items: HTMLElement[] = [];
    for (const el of blocks) {
      const grid = el.matches(groups) ? el : null;
      if (grid) items.push(...(Array.from(grid.children) as HTMLElement[]));
      else items.push(el);
    }

    const fold = window.innerHeight;
    const hidden = items.filter((el) => el.getBoundingClientRect().top > fold * 0.92);
    for (const el of hidden) {
      const sib = el.parentElement && el.parentElement.matches(groups) ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.opacity = "0";
      el.style.translate = "0 28px";
      el.style.transition = `opacity 700ms cubic-bezier(.2,.7,.2,1) ${sib * 90}ms, translate 700ms cubic-bezier(.2,.7,.2,1) ${sib * 90}ms`;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.style.opacity = "1";
          el.style.translate = "0 0";
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    hidden.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}
