"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

type Mode = "BOUTIQUE" | "MARKETING";

// 0 = compte · 1 = activité · 2 = logo · 3 = réseaux · 4 = mode + prix · 5 = stripe
const WIZARD_STEPS = 5; // étapes avec barre de progression (0-4)
const TOTAL_STEPS = WIZARD_STEPS;

const ACTIVITIES = [
  { id: "paragliding", emoji: "🪂", label: "Parapente" },
  { id: "canyoning",   emoji: "🏔️", label: "Canyoning" },
  { id: "rafting",     emoji: "🚣", label: "Rafting" },
  { id: "surf",        emoji: "🏄", label: "Surf" },
  { id: "kayak",       emoji: "🛶", label: "Kayak" },
  { id: "climbing",    emoji: "🧗", label: "Escalade" },
  { id: "skiing",      emoji: "⛷️",  label: "Ski / Snow" },
  { id: "nautical",    emoji: "⛵", label: "Nautique" },
  { id: "other",       emoji: "✨", label: "Autre" },
] as const;

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-");
}

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();

  const [step, setStep]           = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Étape 0
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");

  // Étape 1
  const [activityName, setActivityName] = useState(initialName);
  const [activities, setActivities]     = useState<string[]>([]);

  // Étape 2
  const [logoFile, setLogoFile]         = useState<File | null>(null);
  const [logoPreview, setLogoPreview]   = useState<string | null>(null);

  // Étape 3
  const [instagramHandle, setInstagramHandle] = useState("");
  const [googleReviewUrl, setGoogleReviewUrl] = useState("");
  const [tripadvisorUrl, setTripadvisorUrl]   = useState("");
  const [trustpilotUrl, setTrustpilotUrl]     = useState("");

  // Étape 4
  const [mode, setMode]           = useState<Mode>("BOUTIQUE");
  const [packPrice, setPackPrice] = useState("29");

  // État global
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const slug = slugify(activityName);

  const canContinue = (() => {
    if (step === 0) return email.includes("@") && password.length >= 8;
    if (step === 1) return activityName.trim().length >= 2;
    return true;
  })();

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const isLastStep = step === TOTAL_STEPS - 1;

  function goForward() {
    setError(null);
    setDirection("forward");
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setDirection("backward");
    setStep((s) => s - 1);
  }

  function toggleActivity(id: string) {
    setActivities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  }

  function handleLogoSelect(file: File) {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleContinue() {
    if (step === 0) {
      // Créer le compte Supabase
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);
      if (err) {
        setError(
          err.message === "User already registered"
            ? "Un compte existe déjà avec cet email. Connecte-toi plutôt."
            : "Le réseau a coupé, réessaie dans une minute.",
        );
        return;
      }
      if (!data.session) {
        setEmailSent(true);
        return;
      }
      goForward();
    } else if (!isLastStep) {
      goForward();
    } else {
      // Dernière étape : créer l'opérateur puis démarrer l'onboarding Stripe
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/operator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: activityName,
            packPriceCents: Math.round(Number(packPrice) * 100),
            defaultMode: mode,
            instagramHandle: instagramHandle || undefined,
            googleReviewUrl: googleReviewUrl || undefined,
            trustpilotUrl: trustpilotUrl || undefined,
            tripadvisorUrl: tripadvisorUrl || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError((body as { error?: string }).error ?? "Le réseau a coupé, réessaie dans une minute.");
          setLoading(false);
          return;
        }

        // Upload du logo si sélectionné (non bloquant)
        if (logoFile) {
          try {
            const formData = new FormData();
            formData.append("file", logoFile);
            const logoRes = await fetch("/api/operator/logo", { method: "POST", body: formData });
            if (logoRes.ok) {
              const { logoUrl } = (await logoRes.json()) as { logoUrl: string };
              await fetch("/api/operator/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ logoUrl }),
              });
            }
          } catch {
            // Logo non critique
          }
        }

        // Espace créé — on part sur le dashboard directement
        router.push("/dashboard");
        router.refresh();
      } catch {
        setError("Le réseau a coupé, réessaie dans une minute.");
        setLoading(false);
      }
    }
  }

  /* ── Écran confirmation email ── */
  if (emailSent) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-center">
        <div className="text-6xl">📬</div>
        <h1 className="mt-6 font-display text-2xl font-extrabold text-ink sm:text-3xl">
          Vérifie tes emails !
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-2">
          On t&apos;a envoyé un lien à{" "}
          <strong className="text-ink">{email}</strong>. Clique dessus pour activer ton compte et accéder à ton espace.
        </p>
        <p className="mt-6 text-xs text-muted">
          Pas reçu ?{" "}
          <button onClick={() => setEmailSent(false)} className="underline hover:text-ink-2">
            Réessayer
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Barre de progression */}
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-border">
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between px-6">
        <div
          className={`transition-all duration-300 ${
            step === 0 ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Logo markClassName="h-8 w-8" textClassName="text-base" />
        </div>
        <Link href="/login" className="text-sm font-medium text-ink-2 transition hover:text-ink">
          Se connecter
        </Link>
      </header>

      {/* Contenu */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-28 pt-20">
        <div
          key={`step-${step}`}
          className={`w-full max-w-lg ${
            direction === "forward" ? "animate-step-forward" : "animate-step-backward"
          }`}
        >
          {step === 0 && (
            <StepAccount
              email={email}
              password={password}
              error={error}
              loading={loading}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleContinue}
            />
          )}
          {step === 1 && (
            <StepActivite
              name={activityName}
              slug={slug}
              selected={activities}
              onNameChange={setActivityName}
              onToggle={toggleActivity}
              onEnter={canContinue ? handleContinue : undefined}
            />
          )}
          {step === 2 && (
            <StepLogo
              preview={logoPreview}
              name={activityName}
              onSelect={handleLogoSelect}
              onSkip={goForward}
            />
          )}
          {step === 3 && (
            <StepReseaux
              instagramHandle={instagramHandle}
              googleReviewUrl={googleReviewUrl}
              tripadvisorUrl={tripadvisorUrl}
              trustpilotUrl={trustpilotUrl}
              onInstagramChange={setInstagramHandle}
              onGoogleChange={setGoogleReviewUrl}
              onTripadvisorChange={setTripadvisorUrl}
              onTrustpilotChange={setTrustpilotUrl}
            />
          )}
          {step === 4 && (
            <StepMode
              mode={mode}
              packPrice={packPrice}
              onModeChange={setMode}
              onPriceChange={setPackPrice}
            />
          )}
        </div>
      </main>

      {/* Barre d'actions */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          {step > 0 ? (
            <button
              onClick={goBack}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-2 transition hover:text-ink disabled:opacity-40"
            >
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                <path d="M10 3L5 8l5 5" />
              </svg>
              Retour
            </button>
          ) : (
            <div />
          )}

          {/* Le logo step a son propre bouton "Ignorer" dans le contenu */}
          {step !== 2 && (
            <Button
              variant="accent"
              size="md"
              onClick={handleContinue}
              disabled={loading || !canContinue}
            >
              {loading
                ? isLastStep ? "Création…" : "Vérification…"
                : isLastStep ? "Lancer mon espace"
                : "Continuer"}
              {!loading && !isLastStep && (
                <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
                  <path d="M6 3l5 5-5 5" />
                </svg>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Étape 0 — Compte
───────────────────────────────────────── */
function StepAccount({
  email, password, error, loading,
  onEmailChange, onPasswordChange, onSubmit,
}: {
  email: string; password: string; error: string | null; loading: boolean;
  onEmailChange: (v: string) => void; onPasswordChange: (v: string) => void;
  onSubmit: () => void;
}) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !loading && email.includes("@") && password.length >= 8) onSubmit();
  }
  return (
    <div>
      <StepDots current={0} total={TOTAL_STEPS} />
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Crée ton compte<br />gratuitement.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Aucun frais fixe. Tu paies seulement 20 % sur les ventes effectuées.
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <input
          type="email" autoComplete="email" required autoFocus
          placeholder="ton@email.com"
          value={email} onChange={(e) => onEmailChange(e.target.value)} onKeyDown={handleKey}
          className={`${inputClass} w-full`}
        />
        <input
          type="password" autoComplete="new-password" required
          placeholder="Mot de passe (8 caractères min.)"
          value={password} onChange={(e) => onPasswordChange(e.target.value)} onKeyDown={handleKey}
          className={`${inputClass} w-full`}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <p className="mt-1 text-xs leading-relaxed text-muted">
          En créant ton compte, tu acceptes nos{" "}
          <Link href="/cgu" className="underline hover:text-ink-2">CGU</Link>{" "}
          et notre{" "}
          <Link href="/confidentialite" className="underline hover:text-ink-2">politique de confidentialité</Link>.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Étape 1 — Activité (nom + chips)
───────────────────────────────────────── */
function StepActivite({
  name, slug, selected,
  onNameChange, onToggle, onEnter,
}: {
  name: string; slug: string; selected: string[];
  onNameChange: (v: string) => void; onToggle: (id: string) => void;
  onEnter?: () => void;
}) {
  return (
    <div>
      <StepDots current={1} total={TOTAL_STEPS} />
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Comment s&apos;appelle<br />ton activité ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Ce nom apparaîtra sur tes galeries et dans les messages envoyés à tes clients.
      </p>
      <div className="mt-8">
        <input
          type="text" autoFocus required
          value={name} onChange={(e) => onNameChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          placeholder="Vol Passion Annecy"
          className={`${inputClass} w-full text-base`}
        />
        {slug && (
          <div className="mt-3 flex items-center gap-2 animate-fade-slide-up">
            <span className="text-xs text-muted">Ton URL</span>
            <span className="rounded-full bg-brand-tint px-3 py-1 text-xs font-medium text-brand">
              souvenir.app/{slug}
            </span>
          </div>
        )}
      </div>
      <div className="mt-6">
        <p className="mb-3 text-sm font-medium text-ink">Ton domaine d&apos;activité</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => {
            const isSelected = selected.includes(a.id);
            return (
              <button
                key={a.id} type="button" onClick={() => onToggle(a.id)}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  isSelected
                    ? "border-brand bg-brand-tint text-brand"
                    : "border-border bg-surface text-ink hover:border-border-strong"
                }`}
              >
                <span role="img" aria-label={a.label}>{a.emoji}</span>
                {a.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Étape 2 — Logo / photo de profil
───────────────────────────────────────── */
function StepLogo({
  preview, name, onSelect, onSkip,
}: {
  preview: string | null; name: string;
  onSelect: (f: File) => void; onSkip: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
  }

  return (
    <div>
      <StepDots current={2} total={TOTAL_STEPS} />
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Ajoute ton logo<br />ou une photo.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Elle apparaîtra sur tes galeries. Tu pourras la changer à tout moment dans les réglages.
      </p>

      <div className="mt-10 flex flex-col items-center gap-5">
        {/* Zone d'upload */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface transition hover:border-brand hover:bg-brand-tint"
        >
          {preview ? (
            <Image src={preview} alt="Logo" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              {initials ? (
                <span className="font-display text-3xl font-extrabold text-muted">{initials}</span>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-muted" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
                  <path d="M3 9a2 2 0 0 1 2-2h.5l1.5-2h10l1.5 2H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9Z" />
                </svg>
              )}
            </div>
          )}
          {/* Overlay au hover */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition group-hover:bg-black/20">
            <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M10 3v14M3 10h14" />
            </svg>
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="hidden"
          onChange={handleChange}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-semibold text-brand hover:text-brand-hover"
          >
            {preview ? "Changer l'image" : "Choisir une image"}
          </button>
          <p className="text-xs text-muted">PNG, JPG, WEBP ou SVG · max 5 Mo</p>
        </div>
      </div>

      {/* Boutons en bas du contenu */}
      <div className="mt-10 flex items-center justify-center gap-6">
        {preview && (
          <Button variant="accent" size="md" onClick={onSkip}>
            Continuer
            <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <path d="M6 3l5 5-5 5" />
            </svg>
          </Button>
        )}
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-muted transition hover:text-ink-2"
        >
          {preview ? "Ignorer" : "Passer cette étape"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Étape 3 — Réseaux sociaux et avis
───────────────────────────────────────── */
function StepReseaux({
  instagramHandle, googleReviewUrl, tripadvisorUrl, trustpilotUrl,
  onInstagramChange, onGoogleChange, onTripadvisorChange, onTrustpilotChange,
}: {
  instagramHandle: string; googleReviewUrl: string;
  tripadvisorUrl: string; trustpilotUrl: string;
  onInstagramChange: (v: string) => void; onGoogleChange: (v: string) => void;
  onTripadvisorChange: (v: string) => void; onTrustpilotChange: (v: string) => void;
}) {
  return (
    <div>
      <StepDots current={3} total={TOTAL_STEPS} />
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Tes réseaux<br />et tes avis.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Souvenir intègre ces liens dans les galeries pour collecter des avis et des partages automatiquement. Tout est optionnel.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {/* Instagram */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
            <InstagramIcon />
            Instagram
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3.5 select-none text-sm text-muted">@</span>
            <input
              type="text"
              placeholder="volpassionannecy"
              value={instagramHandle}
              onChange={(e) => onInstagramChange(e.target.value.replace(/^@/, ""))}
              className={`${inputClass} w-full pl-8`}
            />
          </div>
        </div>

        {/* Google Avis */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
            <GoogleIcon />
            Google Avis
          </label>
          <input
            type="url"
            placeholder="https://g.page/r/..."
            value={googleReviewUrl}
            onChange={(e) => onGoogleChange(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>

        {/* TripAdvisor */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
            <TripAdvisorIcon />
            TripAdvisor
          </label>
          <input
            type="url"
            placeholder="https://www.tripadvisor.fr/..."
            value={tripadvisorUrl}
            onChange={(e) => onTripadvisorChange(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>

        {/* Trustpilot */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
            <TrustpilotIcon />
            Trustpilot
          </label>
          <input
            type="url"
            placeholder="https://fr.trustpilot.com/review/..."
            value={trustpilotUrl}
            onChange={(e) => onTrustpilotChange(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
      </div>

      <p className="mt-5 text-xs text-muted">
        Tu pourras modifier ces liens à tout moment dans les réglages.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Étape 4 — Mode + prix
───────────────────────────────────────── */
function StepMode({
  mode, packPrice, onModeChange, onPriceChange,
}: {
  mode: Mode; packPrice: string;
  onModeChange: (m: Mode) => void; onPriceChange: (p: string) => void;
}) {
  return (
    <div>
      <StepDots current={4} total={TOTAL_STEPS} />
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
        Comment veux-tu<br />livrer tes photos ?
      </h1>
      <p className="mt-3 text-base leading-relaxed text-ink-2">
        Tu pourras changer de mode à chaque session selon ton objectif du jour.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <ModeCard
          selected={mode === "BOUTIQUE"}
          onClick={() => onModeChange("BOUTIQUE")}
          title="Boutique"
          badge="Recommandé"
          badgeSelected
          description="Tes clients débloquent leurs photos en HD contre un paiement. Tu encaisses après chaque activité."
          detail="20% de commission · Stripe inclus"
        >
          {mode === "BOUTIQUE" && (
            <div className="mt-4 animate-fade-slide-up">
              <label className="mb-1.5 block text-xs font-semibold text-ink">Prix du pack HD</label>
              <div className="relative">
                <input
                  type="number" inputMode="decimal" min="0" step="1"
                  value={packPrice}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => onPriceChange(e.target.value)}
                  className={`${inputClass} w-full pr-9 text-sm`}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-2">€</span>
              </div>
            </div>
          )}
        </ModeCard>

        <ModeCard
          selected={mode === "MARKETING"}
          onClick={() => onModeChange("MARKETING")}
          title="Marketing"
          badge="Gratuit"
          badgeSelected={false}
          description="Offre tes photos en échange d'un avis Google et d'un partage Instagram. Zéro vente, max de visibilité."
          detail="0% de commission · aucun frais"
        />
      </div>
    </div>
  );
}

function ModeCard({
  selected, onClick, title, badge, badgeSelected, description, detail, children,
}: {
  selected: boolean; onClick: () => void; title: string; badge: string;
  badgeSelected: boolean; description: string; detail: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={`relative flex flex-col items-start rounded-card border p-5 text-left transition-all ${
        selected
          ? "border-brand bg-brand-tint ring-2 ring-brand ring-offset-1"
          : "border-border bg-surface hover:border-border-strong"
      }`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
          selected ? "border-brand bg-brand" : "border-border-strong"
        }`}>
          {selected && (
            <svg viewBox="0 0 8 6" fill="none" className="h-2.5 w-2.5">
              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
          selected && badgeSelected ? "bg-brand text-white" : "bg-canvas text-muted"
        }`}>
          {badge}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-extrabold text-ink">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{description}</p>
      <p className="mt-3 text-[11px] font-medium text-muted">{detail}</p>
      {children}
    </button>
  );
}

/* ─────────────────────────────────────────
   Dots de progression
───────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
            i <= current ? "bg-brand" : "bg-border"
          }`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Icônes plateformes
───────────────────────────────────────── */
function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0 text-ink-2">
      <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path d="M14.5 8.16c0-.53-.05-1.04-.14-1.53H8v2.9h3.65a3.12 3.12 0 0 1-1.36 2.05v1.7h2.2c1.29-1.19 2.01-2.94 2.01-5.12Z" fill="#4285F4" />
      <path d="M8 15c1.84 0 3.37-.6 4.5-1.63l-2.2-1.7a4.5 4.5 0 0 1-6.71-2.36H1.3v1.76A7 7 0 0 0 8 15Z" fill="#34A853" />
      <path d="M3.59 9.31A4.24 4.24 0 0 1 3.37 8c0-.45.08-.89.22-1.31V4.93H1.3A7 7 0 0 0 1 8c0 1.13.27 2.2.3 3.07l2.29-1.76Z" fill="#FBBC05" />
      <path d="M8 3.75c1.03 0 1.96.36 2.69 1.06l2.02-2.02A7 7 0 0 0 1.3 4.93l2.29 1.76A4.17 4.17 0 0 1 8 3.75Z" fill="#EA4335" />
    </svg>
  );
}

function TripAdvisorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 shrink-0">
      <circle cx="4.5" cy="9" r="2.5" stroke="#34E0A1" strokeWidth="1.4" />
      <circle cx="11.5" cy="9" r="2.5" stroke="#34E0A1" strokeWidth="1.4" />
      <path d="M1 6.5h14M4.5 4.5C6 3.5 7 3 8 3s2 .5 3.5 1.5" stroke="#34E0A1" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="4.5" cy="9" r="1" fill="#34E0A1" />
      <circle cx="11.5" cy="9" r="1" fill="#34E0A1" />
    </svg>
  );
}

function TrustpilotIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none">
      <path d="M8 1l1.73 5.09H15L10.63 9.3l1.73 5.09L8 11.18l-4.36 3.21L5.37 9.3 1 6.09h5.27L8 1Z" fill="#00B67A" />
    </svg>
  );
}
