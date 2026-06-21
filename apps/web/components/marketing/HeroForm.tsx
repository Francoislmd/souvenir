"use client";
import { useState } from "react";

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function HeroForm() {
  const [name, setName] = useState("");
  const slug = slugify(name);

  return (
    <form action="/signup" method="get" className="mt-8 w-full max-w-md mx-auto md:mx-0">
      {/* Input row */}
      <div
        className="flex items-center gap-1.5 rounded-[14px] border border-border bg-surface p-1.5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        <span className="shrink-0 select-none pl-3 text-sm text-muted">
          souvenir.app/
        </span>
        <input
          type="text"
          name="name"
          value={slug}
          onChange={(e) => setName(e.target.value)}
          placeholder="votre-ecole"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-medium text-ink placeholder:font-normal placeholder:text-muted focus:outline-none"
          autoComplete="off"
        />
      </div>
      {/* CTA — full width on mobile, inline on sm+ */}
      <button
        type="submit"
        className="mt-2.5 w-full rounded-[12px] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 sm:mt-2 sm:rounded-[10px] sm:py-2.5"
        style={{ background: "var(--brand)" }}
      >
        Démarrer gratuitement
      </button>
      <p className="mt-2.5 text-xs text-muted">
        Mise en place en moins de 5 minutes · Aucun frais fixe · Sans engagement
      </p>
    </form>
  );
}
