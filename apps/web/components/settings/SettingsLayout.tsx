"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { Operator } from "@souvenir/db";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { StripeConnectOnboarding } from "@/components/StripeConnectOnboarding";
import { DEFAULT_DELIVERY_MESSAGE, DEFAULT_INSTAGRAM_CAPTION } from "@/lib/message-templates";

/* ─── Types ─── */
type Section = "general" | "vente" | "paiements" | "reseaux" | "messages";
type SaveStatus = "idle" | "loading" | "saved" | "error";

/* ─── Sidebar nav ─── */
const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
  {
    id: "general",
    label: "Général",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="8" cy="5" r="2.5" />
        <path d="M2.5 13.5c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" />
      </svg>
    ),
  },
  {
    id: "vente",
    label: "Vente",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 4h12M4 4V3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1M5 8h6M5 11h4" />
        <rect x="2" y="4" width="12" height="9" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "paiements",
    label: "Paiements",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" />
        <path d="M1.5 7h13" />
        <path d="M4.5 10.5h2" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "reseaux",
    label: "Réseaux",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="3.5" cy="8" r="1.5" />
        <circle cx="12.5" cy="3.5" r="1.5" />
        <circle cx="12.5" cy="12.5" r="1.5" />
        <path d="M5 7.2l5.5-3M5 8.8l5.5 3" />
      </svg>
    ),
  },
  {
    id: "messages",
    label: "Messages",
    icon: (
      <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v7A1.5 1.5 0 0 1 12.5 12H9l-3 2v-2H3.5A1.5 1.5 0 0 1 2 10.5v-7Z" />
      </svg>
    ),
  },
];

/* ─── Save hook ─── */
function useSave() {
  const [status, setStatus] = useState<SaveStatus>("idle");

  async function save(data: Record<string, unknown>) {
    setStatus("loading");
    try {
      const res = await fetch("/api/operator/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return { status, save };
}

/* ─── Root layout ─── */
export function SettingsLayout({ operator }: { operator: Operator }) {
  const [active, setActive] = useState<Section>("general");

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-extrabold text-ink">Réglages</h1>
        <p className="mt-1 text-sm text-ink-2">Marque, vente, paiements et réseaux.</p>
      </div>

      {/* Mobile tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-1 md:hidden">
        {NAV.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              active === s.id
                ? "bg-accent text-white"
                : "border border-border bg-surface text-ink-2"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-[180px_1fr] md:gap-10">
        {/* Desktop sidebar */}
        <nav className="hidden md:block">
          <div className="sticky top-6 flex flex-col gap-0.5">
            {NAV.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`flex items-center gap-2.5 rounded-control px-3 py-2.5 text-sm font-medium transition-all ${
                  active === s.id
                    ? "bg-accent-tint text-accent"
                    : "text-ink-2 hover:bg-canvas hover:text-ink"
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Section content */}
        <div className="min-w-0">
          {active === "general"   && <SectionGeneral   operator={operator} />}
          {active === "vente"     && <SectionVente     operator={operator} />}
          {active === "paiements" && <SectionPaiements operator={operator} />}
          {active === "reseaux"   && <SectionReseaux   operator={operator} />}
          {active === "messages"  && <SectionMessages  operator={operator} />}
        </div>
      </div>
    </div>
  );
}

/* ─── Section shell ─── */
function SectionCard({
  title,
  description,
  children,
  onSave,
  status,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave?: () => void;
  status?: SaveStatus;
}) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      <div className="divide-y divide-border">{children}</div>
      {onSave && (
        <div className="flex items-center justify-end gap-4 border-t border-border bg-canvas/50 px-6 py-4">
          {status === "saved" && (
            <span className="text-sm font-medium text-success">Enregistré</span>
          )}
          {status === "error" && (
            <span className="text-sm text-danger">Une erreur est survenue.</span>
          )}
          <Button variant="accent" size="sm" onClick={onSave} disabled={status === "loading"}>
            {status === "loading" ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Form row (label gauche · input droite) ─── */
function FormRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 px-6 py-5 sm:grid-cols-[1fr_1.4fr] sm:items-start sm:gap-8">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-ink">{label}</p>
        {hint && <p className="mt-1 text-xs leading-relaxed text-ink-2">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── Section Général ─── */
function SectionGeneral({ operator }: { operator: Operator }) {
  const [name, setName]         = useState(operator.name);
  const [logoUrl, setLogoUrl]   = useState(operator.logoUrl ?? "");
  const [location, setLocation] = useState(operator.location ?? "");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError]         = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { status, save } = useSave();

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/operator/logo", { method: "POST", body });
      const data = (await res.json()) as { logoUrl?: string; error?: string };
      if (!res.ok || !data.logoUrl) { setLogoError(data.error ?? "Envoi échoué."); return; }
      setLogoUrl(data.logoUrl);
    } catch { setLogoError("Le réseau a coupé."); }
    finally { setLogoUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  return (
    <SectionCard
      title="Général"
      description="Informations qui apparaissent sur tes galeries et dans les emails clients."
      onSave={() => save({ name, logoUrl, location })}
      status={status}
    >
      {/* Logo */}
      <FormRow label="Logo" hint="PNG, JPG, WEBP ou SVG · 5 Mo max.">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-canvas transition hover:border-accent"
          >
            {logoUrl ? (
              <Image src={logoUrl} alt="" fill className="object-cover" sizes="64px" />
            ) : (
              <span className="font-display text-xl font-extrabold text-muted">{initials || "+"}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/20">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M8 2v12M2 8h12" />
              </svg>
            </div>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoChange} disabled={logoUploading} />
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => fileRef.current?.click()} className="text-sm font-medium text-accent hover:text-accent-hover" disabled={logoUploading}>
              {logoUploading ? "Envoi en cours…" : logoUrl ? "Changer le logo" : "Choisir un fichier"}
            </button>
            {logoError && <p className="text-xs text-danger">{logoError}</p>}
          </div>
        </div>
      </FormRow>

      {/* Nom */}
      <FormRow label="Nom de l'activité" hint="Affiché sur les galeries et dans les emails.">
        <input required value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} w-full`} />
      </FormRow>

      {/* Lieu */}
      <FormRow label="Lieu" hint="Ex. : Annecy · Affiché dans la galerie du client.">
        <input placeholder="Annecy" value={location} onChange={(e) => setLocation(e.target.value)} className={`${inputClass} w-full`} />
      </FormRow>
    </SectionCard>
  );
}

/* ─── Section Vente ─── */
function SectionVente({ operator }: { operator: Operator }) {
  const [packPrice, setPackPrice]     = useState((operator.packPriceCents / 100).toString());
  const [defaultMode, setDefaultMode] = useState<"BOUTIQUE" | "MARKETING">(operator.defaultMode);
  const { status, save } = useSave();

  return (
    <SectionCard
      title="Vente"
      description="Configuration par défaut appliquée à chaque nouvelle session."
      onSave={() => save({ packPriceCents: Math.round(Number(packPrice) * 100), defaultMode })}
      status={status}
    >
      {/* Mode */}
      <FormRow
        label="Mode par défaut"
        hint="Boutique : le client achète. Marketing : les photos sont offertes contre un avis et un partage."
      >
        <div className="grid grid-cols-2 gap-2">
          {(["BOUTIQUE", "MARKETING"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDefaultMode(m)}
              className={`h-11 rounded-control border text-sm font-medium transition ${
                defaultMode === m
                  ? "border-accent bg-accent-tint text-accent"
                  : "border-border bg-surface text-ink-2 hover:border-border-strong"
              }`}
            >
              {m === "BOUTIQUE" ? "Boutique" : "Marketing"}
            </button>
          ))}
        </div>
      </FormRow>

      {/* Prix */}
      <FormRow label="Prix du pack HD" hint="Uniquement en mode Boutique. Tu peux le modifier session par session.">
        <div className="relative max-w-[140px]">
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={packPrice}
            onChange={(e) => setPackPrice(e.target.value)}
            className={`${inputClass} w-full pr-9`}
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-2">€</span>
        </div>
      </FormRow>
    </SectionCard>
  );
}

/* ─── Section Paiements ─── */
function SectionPaiements({ operator }: { operator: Operator }) {
  const [showSetup, setShowSetup] = useState(false);
  const [syncing, setSyncing]     = useState(false);
  const [onboarded, setOnboarded] = useState(operator.stripeOnboarded);

  async function handleExit() {
    setSyncing(true);
    setShowSetup(false);
    try {
      const res = await fetch("/api/stripe/connect/sync", { method: "POST" });
      const data = (await res.json()) as { stripeOnboarded?: boolean };
      if (data.stripeOnboarded) {
        setOnboarded(true);
        setSyncing(false);
        return;
      }
    } catch { /* on recharge quand même */ }
    // Compte pas encore actif (vérification Stripe en cours) — on recharge
    window.location.reload();
  }

  if (onboarded) {
    return (
      <SectionCard title="Paiements" description="Tes paiements Stripe Connect sont actifs.">
        <FormRow label="Statut">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-tint">
              <svg viewBox="0 0 10 8" fill="none" className="h-3 w-3">
                <path d="M1 4l2.5 2.5L9 1" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-sm font-medium text-success">Paiements actifs</span>
          </div>
        </FormRow>
        <FormRow label="Compte Stripe" hint="Gère tes versements et ta configuration depuis le tableau de bord Stripe.">
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover"
          >
            Ouvrir Stripe Dashboard
            <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2.5 9.5l7-7M4 2.5h5.5V8" />
            </svg>
          </a>
        </FormRow>
      </SectionCard>
    );
  }

  if (syncing) {
    return (
      <SectionCard title="Paiements" description="Vérification de ton compte Stripe…">
        <FormRow label="Statut">
          <div className="flex items-center gap-2.5 text-sm text-ink-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Synchronisation en cours…
          </div>
        </FormRow>
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <SectionCard
        title="Paiements"
        description="Connecte Stripe pour encaisser les packs HD directement sur ton compte."
      >
        <FormRow
          label="Stripe Connect"
          hint="80 % pour toi, 20 % de commission Souvenir. Frais Stripe inclus. Tu seras payé automatiquement après chaque vente."
        >
          {!showSetup ? (
            <Button variant="accent" size="sm" onClick={() => setShowSetup(true)}>
              {operator.stripeAccountId ? "Continuer la configuration" : "Configurer le paiement"}
            </Button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSetup(false)}
              className="text-sm text-ink-2 hover:text-ink"
            >
              Réduire
            </button>
          )}
        </FormRow>
      </SectionCard>

      {showSetup && (
        <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-medium text-ink">Configuration Stripe</p>
            <p className="mt-0.5 text-xs text-ink-2">Tu pourras passer cette étape et y revenir plus tard.</p>
          </div>
          <div className="p-6">
            <StripeConnectOnboarding onExit={handleExit} />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Section Réseaux ─── */
function SectionReseaux({ operator }: { operator: Operator }) {
  const [instagramHandle,     setInstagramHandle]     = useState(operator.instagramHandle ?? "");
  const [instagramPostCaption,setInstagramPostCaption]= useState(operator.instagramPostCaption ?? "");
  const [googleReviewUrl,     setGoogleReviewUrl]     = useState(operator.googleReviewUrl ?? "");
  const [trustpilotUrl,       setTrustpilotUrl]       = useState(operator.trustpilotUrl ?? "");
  const [tripadvisorUrl,      setTripadvisorUrl]      = useState(operator.tripadvisorUrl ?? "");
  const { status, save } = useSave();

  return (
    <SectionCard
      title="Réseaux et avis"
      description="Ces liens sont intégrés dans les galeries pour collecter avis et partages automatiquement."
      onSave={() => save({ instagramHandle, instagramPostCaption, googleReviewUrl, trustpilotUrl, tripadvisorUrl })}
      status={status}
    >
      {/* Instagram */}
      <FormRow label="Instagram" hint="Handle de ton compte sans @.">
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-3.5 select-none text-sm text-muted">@</span>
          <input
            placeholder="volpassionannecy"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ""))}
            className={`${inputClass} w-full pl-8`}
          />
        </div>
      </FormRow>

      {/* Caption Instagram */}
      <FormRow label="Texte de partage Instagram" hint={`Variables : {instagramHandle} et {operatorName}. Laisse vide pour le texte par défaut.`}>
        <textarea
          rows={2}
          placeholder={DEFAULT_INSTAGRAM_CAPTION}
          value={instagramPostCaption}
          onChange={(e) => setInstagramPostCaption(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </FormRow>

      {/* Google */}
      <FormRow label="Google Avis" hint="URL de ta fiche Google pour collecter des avis.">
        <input
          type="url"
          placeholder="https://g.page/r/..."
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          className={`${inputClass} w-full`}
        />
      </FormRow>

      {/* TripAdvisor */}
      <FormRow label="TripAdvisor">
        <input
          type="url"
          placeholder="https://www.tripadvisor.fr/..."
          value={tripadvisorUrl}
          onChange={(e) => setTripadvisorUrl(e.target.value)}
          className={`${inputClass} w-full`}
        />
      </FormRow>

      {/* Trustpilot */}
      <FormRow label="Trustpilot">
        <input
          type="url"
          placeholder="https://fr.trustpilot.com/review/..."
          value={trustpilotUrl}
          onChange={(e) => setTrustpilotUrl(e.target.value)}
          className={`${inputClass} w-full`}
        />
      </FormRow>
    </SectionCard>
  );
}

/* ─── Section Messages ─── */
function SectionMessages({ operator }: { operator: Operator }) {
  const [deliveryMessageTemplate, setDeliveryMessageTemplate] = useState(
    operator.deliveryMessageTemplate ?? DEFAULT_DELIVERY_MESSAGE,
  );
  const [whatsappNumber, setWhatsappNumber] = useState(operator.whatsappNumber ?? "");
  const { status, save } = useSave();

  return (
    <SectionCard
      title="Messages"
      description="Textes envoyés aux clients lors de la livraison des galeries."
      onSave={() => save({ deliveryMessageTemplate, whatsappNumber })}
      status={status}
    >
      {/* Template livraison */}
      <FormRow
        label="Message de livraison"
        hint="Envoyé par email et SMS. Variables : {clientName} (prénom) et {operatorName} (ton activité). Le lien galerie est ajouté automatiquement."
      >
        <textarea
          rows={4}
          value={deliveryMessageTemplate}
          onChange={(e) => setDeliveryMessageTemplate(e.target.value)}
          className="w-full rounded-control border border-border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </FormRow>

      {/* WhatsApp */}
      <FormRow label="Numéro WhatsApp" hint="Optionnel. Laisse vide pour utiliser le numéro partagé Souvenir.">
        <input
          placeholder="+33600000000"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
          className={`${inputClass} w-full`}
        />
      </FormRow>
    </SectionCard>
  );
}
