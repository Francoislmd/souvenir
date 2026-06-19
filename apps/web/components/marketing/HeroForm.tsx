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
    <form action="/signup" method="get" className="mt-10 w-full max-w-md mx-auto md:mx-0">
      <div
        className="flex items-center gap-1.5 rounded-[14px] border border-border bg-surface p-1.5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
      >
        {/* URL prefix */}
        <span className="shrink-0 select-none pl-3 text-sm text-muted">
          souvenir.app/
        </span>
        <input
          type="text"
          name="name"
          value={slug}
          onChange={(e) => setName(e.target.value)}
          placeholder="votre-ecole"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm font-medium text-ink placeholder:font-normal placeholder:text-muted focus:outline-none"
          autoComplete="off"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[10px] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--brand)" }}
        >
          Démarrer gratuitement
        </button>
      </div>
      <p className="mt-2.5 text-xs text-muted">
        Onboarding en quelques minutes · Pas de frais fixes
      </p>
    </form>
  );
}
