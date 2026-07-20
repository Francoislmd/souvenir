"use client";
import { useEffect } from "react";

export function LinktripReveal() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".rv"));

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 20) el.classList.add("on");
    });

    const pending = elements.filter((el) => !el.classList.contains("on"));
    if (!pending.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("on");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -40px 0px" }
    );
    pending.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
