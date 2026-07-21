"use client";

import { useRef } from "react";
import { inputClass } from "@/components/ui/Input";
import type { Brand } from "@/lib/onboarding/types";

export function StepBrand({
  brand,
  onBrandChange,
  logoPreview,
  onSelectLogo,
  companyName,
}: {
  brand: Brand;
  onBrandChange: (patch: Partial<Brand>) => void;
  logoPreview: string | null;
  onSelectLogo: (file: File) => void;
  companyName: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelectLogo(file);
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Faisons de Souvenir une extension de votre marque.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Vos clients voient votre nom et votre logo sur leur galerie.
      </p>

      <div className="mt-8 flex max-w-md flex-col gap-5">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Logo
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface p-3.5 text-left transition hover:border-accent hover:bg-accent-tint"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-control bg-canvas text-ink-2">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4M8 8l4-4 4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              )}
            </span>
            <span className="text-sm">
              <span className="font-semibold text-ink">{logoPreview ? "Logo ajouté ✓" : "Déposez votre logo"}</span>
              <span className="block text-xs text-muted">PNG ou SVG</span>
            </span>
          </button>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleFile} />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Nom affiché aux clients
          <input
            type="text"
            placeholder={companyName || "Nautic Center"}
            value={brand.name}
            onChange={(e) => onBrandChange({ name: e.target.value, touched: true })}
            className={`${inputClass} w-full`}
          />
        </label>
      </div>
    </div>
  );
}
