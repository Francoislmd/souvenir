"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

export function OnboardingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [packPrice, setPackPrice] = useState("22");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const packCents = Math.round(Number(packPrice) * 100);

    const res = await fetch("/api/operator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        pricePhotoCents: Math.round(packCents / 3),
        pricePackCents: packCents,
        priceAllCents: Math.round(packCents * 1.6),
      }),
    });

    if (!res.ok) {
      setLoading(false);
      setError("Le réseau a coupé — réessaie dans une minute.");
      return;
    }

    router.push("/reglages");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Nom de votre structure
        <input
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Vol Passion Annecy"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Prix du pack de 3 photos
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

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Création…" : "Continuer"}
      </Button>
    </form>
  );
}
