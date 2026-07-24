"use client";

import { useEffect, useRef, useState } from "react";

function fmt(n: number, d: number): string {
  const f = n.toFixed(d);
  const [intPart, decPart] = f.split(".");
  const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart ? `${withSep},${decPart}` : withSep;
}

export function CountUp({ value, decimals = 2, suffix = "" }: { value: number; decimals?: number; suffix?: string }) {
  const [text, setText] = useState(() => fmt(0, decimals) + suffix);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced.current) {
      setText(fmt(value, decimals) + suffix);
      return;
    }
    const t0 = performance.now();
    let raf: number;
    function frame(now: number) {
      const k = Math.min(1, (now - t0) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      setText(fmt(value * e, decimals) + suffix);
      if (k < 1) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{text}</>;
}
