"use client";

import { useState, type FormEvent } from "react";
import type { Operator } from "@souvenir/db";
import { DEFAULT_DELIVERY_MESSAGE } from "@/lib/message-templates";

type ModeOption = "BOUTIQUE" | "MARKETING";

const inputClass =
  "h-11 rounded-control border border-border bg-surface px-3.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function SettingsForm({ operator }: { operator: Operator }) {
  const [name, setName] = useState(operator.name);
  const [logoUrl, setLogoUrl] = useState(operator.logoUrl ?? "");
  const [location, setLocation] = useState(operator.location ?? "");
  const [packPrice, setPackPrice] = useState((operator.packPriceCents / 100).toString());
  const [defaultMode, setDefaultMode] = useState<ModeOption>(operator.defaultMode);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(operator.googleReviewUrl ?? "");
  const [instagramHandle, setInstagramHandle] = useState(operator.instagramHandle ?? "");
  const [whatsappNumber, setWhatsappNumber] = useState(operator.whatsappNumber ?? "");
  const [deliveryMessageTemplate, setDeliveryMessageTemplate] = useState(
    operator.deliveryMessageTemplate ?? DEFAULT_DELIVERY_MESSAGE,
  );
  const [status, setStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setLogoUploadError(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/operator/logo", { method: "POST", body });
      const data = (await res.json()) as { logoUrl?: string; error?: string };
      if (!res.ok || !data.logoUrl) {
        setLogoUploadError(data.error ?? "L'envoi a échoué, réessaie.");
        return;
      }
      setLogoUrl(data.logoUrl);
    } catch {
      setLogoUploadError("Le réseau a coupé — réessaie.");
    } finally {
      setLogoUploading(false);
      event.target.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/operator/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        logoUrl,
        location,
        packPriceCents: Math.round(Number(packPrice) * 100),
        defaultMode,
        googleReviewUrl,
        instagramHandle,
        whatsappNumber,
        deliveryMessageTemplate,
      }),
    });

    setStatus(res.ok ? "saved" : "error");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Marque</h2>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Nom de l&apos;école
            <input required value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
          </label>

          <div className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Logo
            <div className="flex items-center gap-3">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="h-12 w-12 rounded-control border border-border object-cover" />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-control border border-dashed border-border text-xs text-muted">
                  Aucun
                </div>
              )}
              <label className="flex h-11 cursor-pointer items-center rounded-control border border-border bg-surface px-3.5 text-sm font-medium text-ink transition hover:border-border-strong">
                {logoUploading ? "Envoi…" : "Choisir une image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-xs font-normal text-ink-2">PNG, JPG, WEBP ou SVG, 5 Mo max.</span>
            {logoUploadError ? <span className="text-xs font-normal text-danger">{logoUploadError}</span> : null}
          </div>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Lieu
            <input
              placeholder="Annecy"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className={inputClass}
            />
            <span className="text-xs font-normal text-ink-2">Affiché dans la galerie du client (ex : &quot;Annecy&quot;).</span>
          </label>
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card">
          <h2 className="text-base font-semibold text-ink">Vente</h2>

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
          </fieldset>
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card md:col-span-2">
          <h2 className="text-base font-semibold text-ink">Message envoyé au client</h2>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Message accompagnant l&apos;email et le SMS
            <textarea
              rows={3}
              value={deliveryMessageTemplate}
              onChange={(event) => setDeliveryMessageTemplate(event.target.value)}
              className="min-h-[88px] rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <span className="text-xs font-normal text-ink-2">
              Variables disponibles : <code>{"{clientName}"}</code> (prénom du client) et{" "}
              <code>{"{operatorName}"}</code> (nom de ton école). Le lien vers la galerie est ajouté automatiquement.
            </span>
          </label>
        </section>

        <section className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5 shadow-card md:col-span-2">
          <h2 className="text-base font-semibold text-ink">Avis & réseaux</h2>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Lien avis Google
            <input
              type="url"
              placeholder="https://g.page/r/…"
              value={googleReviewUrl}
              onChange={(event) => setGoogleReviewUrl(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Compte Instagram
            <input
              placeholder="volpassionannecy"
              value={instagramHandle}
              onChange={(event) => setInstagramHandle(event.target.value)}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Numéro WhatsApp (optionnel)
            <input
              placeholder="+33600000000"
              value={whatsappNumber}
              onChange={(event) => setWhatsappNumber(event.target.value)}
              className={inputClass}
            />
            <span className="text-xs font-normal text-ink-2">
              Laisse vide pour utiliser le numéro WhatsApp partagé Souvenir.
            </span>
          </label>
        </section>
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 rounded-control bg-accent text-sm font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
      >
        {status === "loading" ? "Enregistrement…" : "Enregistrer"}
      </button>
      {status === "saved" ? <p className="text-center text-sm text-success">Enregistré ✓</p> : null}
      {status === "error" ? <p className="text-center text-sm text-danger">Le réseau a coupé — réessaie.</p> : null}
    </form>
  );
}
