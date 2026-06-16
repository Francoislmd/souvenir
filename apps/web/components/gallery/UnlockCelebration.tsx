"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

export function UnlockCelebration({ id }: { id: string }) {
  useEffect(() => {
    const key = `souvenir:celebrated:${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const colors = ["#4F46E5", "#7DD3FC", "#A78BFA", "#16A34A"];
    const fire = (options: confetti.Options): void => {
      void confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 45,
        ticks: 200,
        gravity: 1.1,
        colors,
        ...options,
      });
    };

    fire({ angle: 60, origin: { x: 0, y: 0.9 } });
    fire({ angle: 120, origin: { x: 1, y: 0.9 } });
  }, [id]);

  return null;
}
