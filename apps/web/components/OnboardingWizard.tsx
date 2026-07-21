"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-browser";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";
import { Stepper } from "@/components/onboarding/Stepper";
import { StepActivities } from "@/components/onboarding/StepActivities";
import { StepCompany } from "@/components/onboarding/StepCompany";
import { StepExperience } from "@/components/onboarding/StepExperience";
import { StepPhotoMode } from "@/components/onboarding/StepPhotoMode";
import { StepBrand } from "@/components/onboarding/StepBrand";
import { StepPricing } from "@/components/onboarding/StepPricing";
import { ValueEstimate } from "@/components/onboarding/ValueEstimate";
import { StepPayments } from "@/components/onboarding/StepPayments";
import { Activation } from "@/components/onboarding/Activation";
import type {
  Company,
  Experience,
  PhotoMode,
  Brand,
  Pricing,
  PersistedOnboardingState,
} from "@/lib/onboarding/types";

const STORAGE_KEY = "souvenir:onboarding:v1";

const STEP_ORDER = [
  "compte",
  "activites",
  "entreprise",
  "experience",
  "photos",
  "marque",
  "revenus",
  "estimation",
  "paiements",
  "activation",
] as const;
type WizardStep = (typeof STEP_ORDER)[number];

const STEPPER_STEPS: WizardStep[] = ["activites", "entreprise", "experience", "photos", "marque", "revenus"];

const DEFAULT_COMPANY: Company = { name: "", website: "", instagram: "", city: "" };
const DEFAULT_EXP: Experience = { group: "6-15", freq: "6-15", guides: "oui" };
const DEFAULT_PHOTO_MODE: PhotoMode = "guides";
const DEFAULT_BRAND: Brand = { name: "", color: "#FF5A1F", touched: false };
const DEFAULT_PRICING: Pricing = { packEuros: "22" };

export function OnboardingWizard({ initialName }: { initialName: string }) {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Étape 0 — compte
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Étapes 1-6 — qualification, hydratée depuis localStorage si une reprise existe
  const [activities, setActivities] = useState<Set<string>>(new Set());
  const [company, setCompany] = useState<Company>({ ...DEFAULT_COMPANY, name: initialName });
  const [exp, setExp] = useState<Experience>(DEFAULT_EXP);
  const [photoMode, setPhotoMode] = useState<PhotoMode>(DEFAULT_PHOTO_MODE);
  const [brand, setBrand] = useState<Brand>(DEFAULT_BRAND);
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);

  // Logo — jamais persisté en localStorage (c'est un File)
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [stripeOnboarded, setStripeOnboarded] = useState(false);
  const hydrated = useRef(false);

  // Reprise — hydrate depuis localStorage une fois au montage (jamais les identifiants).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as PersistedOnboardingState;
        setActivities(new Set(saved.activities));
        setCompany(saved.company);
        setExp(saved.exp);
        setPhotoMode(saved.photoMode);
        setBrand(saved.brand);
        setPricing(saved.pricing);
      }
    } catch {
      // localStorage corrompu ou indisponible — on repart des défauts
    } finally {
      hydrated.current = true;
    }
  }, []);

  // Persistance à chaque changement (jamais les identifiants du compte).
  useEffect(() => {
    if (!hydrated.current) return;
    const payload: PersistedOnboardingState = {
      activities: Array.from(activities),
      company,
      exp,
      photoMode,
      brand,
      pricing,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [activities, company, exp, photoMode, brand, pricing]);

  const currentStep: WizardStep = STEP_ORDER[step];
  const stepperIndex = STEPPER_STEPS.indexOf(currentStep);
  const showStepper = stepperIndex >= 0;

  const canContinue = (() => {
    if (currentStep === "compte") return email.includes("@") && password.length >= 8;
    if (currentStep === "activites") return activities.size > 0;
    if (currentStep === "entreprise") return company.name.trim().length >= 2;
    if (currentStep === "marque") return (brand.name || company.name).trim().length >= 2;
    return true;
  })();

  const progress = ((step + 1) / STEP_ORDER.length) * 100;
  const packPriceCents = Math.round(Number(pricing.packEuros) * 100) || 0;

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
    setActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleLogoSelect(file: File) {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAccountSubmit() {
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
  }

  async function handleActivate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brand.name.trim() || company.name,
          packPriceCents,
          defaultMode: "BOUTIQUE",
          location: company.city || undefined,
          brandColor: brand.color,
          instagramHandle: company.instagram || undefined,
          qualification: {
            activities: Array.from(activities),
            website: company.website || undefined,
            experience: exp,
            photoMode,
          },
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Le réseau a coupé, réessaie dans une minute.");
        setLoading(false);
        return;
      }

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

      window.localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      goForward(); // -> paiements
    } catch {
      setError("Le réseau a coupé, réessaie dans une minute.");
      setLoading(false);
    }
  }

  function handlePaymentsDone(onboarded: boolean) {
    setStripeOnboarded(onboarded);
    goForward(); // -> activation
  }

  function handleContinue() {
    if (currentStep === "compte") {
      void handleAccountSubmit();
    } else if (currentStep === "estimation") {
      void handleActivate();
    } else {
      goForward();
    }
  }

  // Entrée valide l'étape courante (étapes 1-6 uniquement — compte a ses propres
  // champs, estimation/activation ont leur propre CTA centré).
  useEffect(() => {
    if (!showStepper || !canContinue) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      goForward();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showStepper, canContinue]);

  function openDashboard() {
    router.push("/dashboard");
    router.refresh();
  }

  /* ── Écran confirmation email ── */
  if (emailSent) {
    return (
      <div className="ob-theme flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-12 text-center">
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

  const showActionBar = currentStep !== "estimation" && currentStep !== "paiements" && currentStep !== "activation";

  return (
    <div className="ob-theme flex h-dvh flex-col overflow-hidden bg-canvas">
      {/* Barre de progression */}
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-border">
        <div className="h-full bg-brand transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
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

      {showStepper && (
        <div className="fixed inset-x-0 top-16 z-30 hidden justify-center border-b border-border bg-canvas/90 px-6 py-3 backdrop-blur-md md:flex">
          <div className="w-full max-w-3xl">
            <Stepper current={stepperIndex} />
          </div>
        </div>
      )}

      {/* Contenu — scène unique, scroll interne seulement si l'étape déborde */}
      <main
        className={`flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 pb-28 ${
          showStepper ? "pt-24 md:pt-28" : "pt-20"
        }`}
      >
        <div
          key={`step-${step}`}
          className={`w-full max-w-lg ${
            direction === "forward" ? "animate-step-forward" : "animate-step-backward"
          }`}
        >
          {showStepper && (
            <div className="mb-6 md:hidden">
              <Stepper current={stepperIndex} />
            </div>
          )}

          {currentStep === "compte" && (
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

          {currentStep === "activites" && <StepActivities selected={activities} onToggle={toggleActivity} />}

          {currentStep === "entreprise" && (
            <StepCompany company={company} onChange={(patch) => setCompany((c) => ({ ...c, ...patch }))} />
          )}

          {currentStep === "experience" && (
            <StepExperience exp={exp} onChange={(patch) => setExp((e) => ({ ...e, ...patch }))} />
          )}

          {currentStep === "photos" && <StepPhotoMode value={photoMode} onChange={setPhotoMode} />}

          {currentStep === "marque" && (
            <StepBrand
              brand={brand}
              onBrandChange={(patch) => setBrand((b) => ({ ...b, ...patch }))}
              logoPreview={logoPreview}
              onSelectLogo={handleLogoSelect}
              companyName={company.name}
            />
          )}

          {currentStep === "revenus" && (
            <StepPricing packEuros={pricing.packEuros} onChange={(v) => setPricing({ packEuros: v })} />
          )}

          {currentStep === "estimation" && (
            <div>
              <ValueEstimate exp={exp} packPriceCents={packPriceCents} />
              {error && (
                <div className="mx-auto mt-4 max-w-md text-center">
                  <p className="text-sm text-danger">{error}</p>
                  <button
                    type="button"
                    onClick={goBack}
                    className="mt-2 text-sm font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
                  >
                    ← Revenir corriger mes informations
                  </button>
                </div>
              )}
              <div className="mt-8 flex justify-center">
                <Button variant="accent" size="lg" onClick={handleContinue} disabled={loading}>
                  {loading ? "Activation…" : "C'est parti"}
                  {!loading && <ContinueArrow />}
                </Button>
              </div>
            </div>
          )}

          {currentStep === "paiements" && <StepPayments onDone={handlePaymentsDone} />}

          {currentStep === "activation" && (
            <Activation stripeOnboarded={stripeOnboarded} onOpenDashboard={openDashboard} />
          )}
        </div>
      </main>

      {/* Barre d'actions — masquée sur estimation/activation (CTA centré propre à l'écran) */}
      {showActionBar && (
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

            <Button variant="accent" size="md" onClick={handleContinue} disabled={loading || !canContinue}>
              {loading
                ? currentStep === "compte" ? "Vérification…" : "Chargement…"
                : currentStep === "revenus" ? "Voir mon potentiel"
                : "Continuer"}
              {!loading && <ContinueArrow />}
            </Button>
          </div>
        </div>
      )}
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
      <h1 className="font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
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

function ContinueArrow() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}
