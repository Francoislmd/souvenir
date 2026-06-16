"use client";

import { useId } from "react";

/**
 * Marque Souvenir : carte photo instantanée inclinée, cadre crème + cliché au
 * dégradé ciel (--brand-gradient).
 */
export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  const gradientId = useId();

  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7DD3FC" />
          <stop offset="0.55" stopColor="#3B82F6" />
          <stop offset="1" stopColor="#4F46E5" />
        </linearGradient>
      </defs>
      <g transform="rotate(-8 16 16)">
        <rect x="3" y="3" width="26" height="26" rx="4" fill="#FFFBF6" />
        <rect x="6" y="6" width="20" height="14" rx="1.5" fill={`url(#${gradientId})`} />
      </g>
    </svg>
  );
}

export function Logo({
  className = "",
  markClassName = "h-8 w-8",
  textClassName = "text-lg",
}: {
  className?: string;
  markClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={markClassName} />
      <span className={`font-display font-extrabold tracking-tight text-ink ${textClassName}`}>Souvenir</span>
    </span>
  );
}
