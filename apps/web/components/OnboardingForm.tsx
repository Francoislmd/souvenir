"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

type ModeOption = "BOUTIQUE" | "MARKETING";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [packPrice, setPackPrice] = useState("29");
  const [defaultMode, setDefaultMode] = useState<ModeOption>("BOUTIQUE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        packPriceCents: Math.round(Number(packPrice) * 100),
        defaultMode,
      }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Le réseau a coupé — réessaie dans une minute.");
      return;
    }

    router.push("/settings");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Nom de ton école
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Vol Passion Annecy"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Prix du pack HD
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            required
            value={packPrice}
            onChange={(event) => setPackPrice(event.target.value)}
            className={`${inputClass} w-full pr-9`}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2">€</span>
        </div>
      </label>

      <fieldset className="flex flex-col gap-2 text-sm font-medium text-ink">
        <legend className="mb-1">Mode par défaut</legend>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDefaultMode("BOUTIQUE")}
            className={`h-11 rounded-control border text-sm font-medium transition ${
              defaultMode === "BOUTIQUE" ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-2"
            }`}
          >
            Boutique
          </button>
          <button
            type="button"
            onClick={() => setDefaultMode("MARKETING")}
            className={`h-11 rounded-control border text-sm font-medium transition ${
              defaultMode === "MARKETING" ? "border-accent bg-accent-tint text-accent" : "border-border bg-surface text-ink-2"
            }`}
          >
            Marketing
          </button>
        </div>
        <p className="text-xs font-normal text-ink-2">
          {defaultMode === "BOUTIQUE"
            ? "Aperçu offert, le client achète le pack HD."
            : "Tout est offert, en échange d'un avis, d'un email et d'un partage."}
        </p>
      </fieldset>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" variant="accent" size="lg" disabled={loading} className="w-full">
        {loading ? "Création…" : "Continuer"}
      </Button>
    </form>
  );
}
