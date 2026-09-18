"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { gtmEvent } from "@/lib/gtm";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { operatorTagline } from "@/lib/tagline";
import { Spinner } from "@/components/ui/Spinner";
import { StripeOnboarding } from "@/components/stripe/StripeOnboarding";
import styles from "./onboarding.module.css";

/*
 * L'inscription d'un pro, en six écrans : compte, structure, page, prix,
 * paiements, première sortie. Maquette : docs/maquette-onboarding-pro-v1.html.
 *
 * Chaque écran enregistre en partant. L'étape de départ est calculée par le
 * serveur (app/signup/page.tsx) à partir de ce qui existe déjà : un pro qui
 * ferme l'onglet reprend où il en était, sans rien stocker dans le navigateur.
 * La dernière étape crée la sortie et ouvre son écran dans l'espace pro, où
 * se font le dépôt des photos et la publication.
 */

export type OnboardingStep = "compte" | "structure" | "page" | "prix" | "paiements" | "sortie";

const ORDER: OnboardingStep[] = ["compte", "structure", "page", "prix", "paiements", "sortie"];

export interface OnboardingOperator {
  name: string;
  slug: string;
  activities: string[];
  logoUrl: string | null;
  coverUrl: string | null;
  tagline: string | null;
  priceAllCents: number;
  pricePhotoCents: number;
  packOnly: boolean;
  stripeOnboarded: boolean;
}

type DayChoice = "today" | "tomorrow" | "other";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "") || "votre-structure"
  );
}

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function euros(cents: number): string {
  return String(Math.round(cents) / 100).replace(".", ",");
}

function cents(value: string): number | null {
  const n = Number(value.replace(",", ".").trim());
  if (!Number.isFinite(n) || n <= 0 || n > 1000) return null;
  return Math.round(n * 100);
}

async function patchSettings(body: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch("/api/operator/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

const NETWORK = "Le réseau a coupé, réessayez dans une minute.";

/* ── Icônes : grille 24, trait 1,5 à 1,8, currentColor ───────────── */
function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}
function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function Onboarding({
  initialStep,
  initialEmail,
  initialName,
  operator: initialOperator,
  storeBase,
}: {
  initialStep: OnboardingStep;
  initialEmail: string;
  initialName: string;
  operator: OnboardingOperator | null;
  /** « store.linktrip.co/ », tel qu'on l'affiche sous le nom. */
  storeBase: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<OnboardingStep>(initialStep);
  const [op, setOp] = useState<OnboardingOperator | null>(initialOperator);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Une étape = un événement, avec son rang : l'entonnoir d'inscription dans
  // GA4 se lit sur onboarding_step, décomposé par step_name.
  useEffect(() => {
    gtmEvent("onboarding_step", { step_index: ORDER.indexOf(step) + 1, step_name: step, step_total: ORDER.length });
    if (step === "compte") gtmEvent("sign_up_start", { method: "email" });
    window.scrollTo(0, 0);
  }, [step]);

  function go(next: OnboardingStep): void {
    setError(null);
    setBusy(false);
    setStep(next);
  }

  const index = ORDER.indexOf(step);
  // On ne revient ni sur le compte (il existe), ni sur la structure (elle
  // est créée) : on les corrige ensuite dans Réglages.
  const back: OnboardingStep | null =
    index <= 2 ? null : step === "sortie" && op?.stripeOnboarded ? "prix" : ORDER[index - 1]!;

  return (
    <div className={styles.ob}>
      <header className={styles.head}>
        {back ? (
          <button type="button" className={styles.back} onClick={() => go(back)} aria-label="Retour">
            <BackIcon />
          </button>
        ) : (
          <span className={styles.backGhost} aria-hidden="true" />
        )}
        <div className={styles.prog} aria-hidden="true">
          {ORDER.map((s, i) => (
            <i key={s} className={i <= index ? styles.on : undefined} />
          ))}
        </div>
        {step === "compte" ? (
          <Link href="/connexion" className={styles.login}>
            Se connecter
          </Link>
        ) : (
          <span className={styles.loginGhost} aria-hidden="true" />
        )}
      </header>

      {step === "compte" ? (
        <StepAccount initialEmail={initialEmail} onSignedIn={() => router.refresh()} />
      ) : null}

      {step === "structure" ? (
        <StepStructure
          initialName={initialName}
          storeBase={storeBase}
          busy={busy}
          error={error}
          onSubmit={async (name, activities) => {
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/operator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, qualification: { activities } }),
              });
              if (res.status === 409) {
                router.refresh();
                return;
              }
              const body = (await res.json().catch(() => ({}))) as { slug?: string; error?: string };
              if (!res.ok || !body.slug) {
                setError(body.error ?? NETWORK);
                setBusy(false);
                return;
              }
              // Compte opérateur réellement créé : c'est LA conversion côté
              // acquisition, bien plus fiable que sign_up.
              gtmEvent("onboarding_complete", { activities: activities.join(","), activities_count: activities.length });
              setOp({
                name,
                slug: body.slug,
                activities,
                logoUrl: null,
                coverUrl: null,
                tagline: null,
                priceAllCents: 3900,
                pricePhotoCents: 800,
                packOnly: true,
                stripeOnboarded: false,
              });
              go("page");
            } catch {
              setError(NETWORK);
              setBusy(false);
            }
          }}
        />
      ) : null}

      {step === "page" && op ? <StepPage op={op} onChange={(patch) => setOp({ ...op, ...patch })} onNext={() => go("prix")} /> : null}

      {step === "prix" && op ? (
        <StepPrices
          op={op}
          busy={busy}
          error={error}
          onSubmit={async (patch) => {
            setBusy(true);
            setError(null);
            const ok = await patchSettings(patch);
            if (!ok) {
              setError(NETWORK);
              setBusy(false);
              return;
            }
            setOp({ ...op, ...patch });
            go(op.stripeOnboarded ? "sortie" : "paiements");
          }}
        />
      ) : null}

      {step === "paiements" && op ? (
        <StepPayments
          onReady={() => {
            gtmEvent("stripe_onboarding_done", { skipped: false });
            setOp({ ...op, stripeOnboarded: true });
            go("sortie");
          }}
          onLater={() => {
            gtmEvent("stripe_onboarding_start", { skipped: true });
            go("sortie");
          }}
        />
      ) : null}

      {step === "sortie" && op ? <StepSortie activities={op.activities} /> : null}
    </div>
  );
}

/* ── 1. Compte : un code reçu par e-mail, tapé dans le même onglet ─── */
function StepAccount({ initialEmail, onSignedIn }: { initialEmail: string; onSignedIn: () => void }) {
  const [email, setEmail] = useState(initialEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  function describe(err: { status?: number; message: string }): string {
    const status = err.status ?? 0;
    if (status === 429) return "Trop de demandes. Réessayez dans quelques minutes.";
    // Une panne côté Supabase (402 quota, 5xx) doit se dire : sinon on la
    // cherche des heures du côté du formulaire.
    if (status >= 500 || status === 402) {
      console.error("[signup] panne côté Supabase", err);
      return "Le service est momentanément indisponible. Réessayez dans quelques minutes.";
    }
    if (status === 0) return NETWORK;
    return err.message;
  }

  async function sendCode(address: string): Promise<boolean> {
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email: address,
      options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/auth/callback?next=/signup` },
    });
    if (err) {
      setError(describe(err));
      return false;
    }
    return true;
  }

  async function submitEmail(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError(address.includes("@") ? "Cette adresse ne semble pas complète." : "Il manque le @ dans l'adresse.");
      return;
    }
    setBusy(true);
    setError(null);
    const ok = await sendCode(address);
    setBusy(false);
    if (!ok) return;
    setSentTo(address);
    setCode("");
    setTimeout(() => codeRef.current?.focus(), 50);
  }

  async function verify(token: string): Promise<void> {
    if (!sentTo || busy) return;
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email: sentTo, token, type: "email" });
    if (err) {
      setBusy(false);
      setError(err.status === 403 || err.status === 400 ? "Ce code ne correspond pas, ou il a expiré. Vérifiez le dernier e-mail reçu." : describe(err));
      return;
    }
    gtmEvent("sign_up", { method: "email", verification_pending: false });
    onSignedIn();
  }

  if (sentTo) {
    return (
      <div className={styles.scr}>
        <h1>Entrez le code reçu.</h1>
        <p className={styles.lede}>
          Envoyé à <b>{sentTo}</b>.
        </p>
        <input
          ref={codeRef}
          id="obCode"
          className={`${styles.inp} ${styles.code}`}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={8}
          aria-label="Code reçu par e-mail"
          value={code}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 8);
            setCode(v);
            // Six chiffres : c'est la longueur par défaut des codes Supabase.
            if (v.length === 6) void verify(v);
          }}
          disabled={busy}
        />
        {error ? <p className={styles.err}>{error}</p> : null}
        {resent && !error ? <p className={styles.info}>Un nouveau code est parti.</p> : null}
        <div className={styles.foot}>
          <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={() => void verify(code)} disabled={busy || code.length < 6}>
            {busy ? <Spinner size={16} tone="current" label="Vérification" /> : null}
            {busy ? "Vérification…" : "Valider"}
          </button>
          <p className={styles.links}>
            <button
              type="button"
              className={styles.link}
              onClick={async () => {
                setError(null);
                if (await sendCode(sentTo)) setResent(true);
              }}
            >
              Renvoyer le code
            </button>
            <button
              type="button"
              className={styles.link}
              onClick={() => {
                setSentTo(null);
                setError(null);
                setResent(false);
              }}
            >
              Changer d&rsquo;adresse
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.scr} onSubmit={(e) => void submitEmail(e)} noValidate>
      <h1>Créez votre compte Linktrip.</h1>
      <p className={styles.lede}>Nous vous envoyons un code par e-mail. Pas de mot de passe à retenir.</p>
      <label className={styles.lbl} htmlFor="obEmail">
        Votre adresse e-mail
      </label>
      <input
        id="obEmail"
        className={styles.inp}
        type="email"
        autoComplete="email"
        placeholder="vous@votre-structure.fr"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setError(null);
        }}
        autoFocus
      />
      {error ? <p className={styles.err}>{error}</p> : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Envoi du code" /> : null}
          {busy ? "Envoi…" : "Recevoir un code"}
        </button>
        <p className={styles.legal}>
          En continuant, vous acceptez les <Link href="/cgu">CGU</Link>, les <Link href="/cgv">CGV</Link> et la{" "}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </div>
    </form>
  );
}

/* ── 2. Structure : le nom et les activités ────────────────────────── */
function StepStructure({
  initialName,
  storeBase,
  busy,
  error,
  onSubmit,
}: {
  initialName: string;
  storeBase: string;
  busy: boolean;
  error: string | null;
  onSubmit: (name: string, activities: string[]) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [picked, setPicked] = useState<string[]>([]);
  const [local, setLocal] = useState<string | null>(null);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (name.trim().length < 2) {
      setLocal("Il manque le nom de la structure.");
      return;
    }
    if (picked.length === 0) {
      setLocal("Choisissez au moins une activité.");
      return;
    }
    setLocal(null);
    void onSubmit(name.trim(), picked);
  }

  return (
    <form className={styles.scr} onSubmit={submit} noValidate>
      <h1>Votre structure.</h1>
      <label className={styles.lbl} htmlFor="obName">
        Son nom
      </label>
      <input
        id="obName"
        className={styles.inp}
        value={name}
        autoComplete="organization"
        placeholder="Eaux Vives Ardèche"
        onChange={(e) => setName(e.target.value)}
        autoFocus={!initialName}
      />
      <p className={styles.url}>
        <LinkIcon />
        <span>
          {storeBase}
          {slugify(name)}
        </span>
      </p>
      <p className={styles.lbl}>
        Ce que vous proposez <small>une ou plusieurs</small>
      </p>
      <div className={styles.chips}>
        {ACTIVITIES.map((a) => {
          const on = picked.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              className={`${styles.chip} ${on ? styles.chipOn : ""}`}
              aria-pressed={on}
              onClick={() => setPicked(on ? picked.filter((id) => id !== a.id) : [...picked, a.id])}
            >
              {a.label}
            </button>
          );
        })}
      </div>
      {local || error ? <p className={styles.err}>{local ?? error}</p> : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Création" /> : null}
          {busy ? "Création…" : "Continuer"}
        </button>
      </div>
    </form>
  );
}

/* ── 3. Votre page : couverture, logo, phrase, sur la page elle-même ── */
function StepPage({
  op,
  onChange,
  onNext,
}: {
  op: OnboardingOperator;
  onChange: (patch: Partial<OnboardingOperator>) => void;
  onNext: () => void;
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"cover" | "logo" | null>(null);
  const [editTag, setEditTag] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auto = operatorTagline(op.activities);
  const tagline = op.tagline || auto || "Vos photos de la journée";

  async function upload(kind: "cover" | "logo", file: File): Promise<void> {
    setUploading(kind);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/operator/${kind}`, { method: "POST", body: form });
      const body = (await res.json().catch(() => ({}))) as { coverUrl?: string; logoUrl?: string; error?: string };
      const url = kind === "cover" ? body.coverUrl : body.logoUrl;
      if (!res.ok || !url) {
        setError(body.error ?? NETWORK);
        return;
      }
      const saved = await patchSettings(kind === "cover" ? { coverUrl: url } : { logoUrl: url });
      if (!saved) {
        setError(NETWORK);
        return;
      }
      onChange(kind === "cover" ? { coverUrl: url } : { logoUrl: url });
    } catch {
      setError(NETWORK);
    } finally {
      setUploading(null);
    }
  }

  function saveTag(value: string): void {
    const v = value.trim();
    const next = v && v !== auto ? v : null;
    setEditTag(false);
    if (next === op.tagline) return;
    onChange({ tagline: next });
    void patchSettings({ tagline: next ?? "" }).then((ok) => {
      if (!ok) setError(NETWORK);
    });
  }

  return (
    <div className={styles.scr}>
      <h1>Votre page.</h1>
      <p className={styles.lede}>Touchez la photo, le rond ou la phrase pour les modifier.</p>

      <div className={styles.card}>
        <button
          type="button"
          className={`${styles.cover} ${op.coverUrl ? styles.coverHas : ""}`}
          onClick={() => coverInput.current?.click()}
          aria-label={op.coverUrl ? "Changer la photo de couverture" : "Ajouter une photo de couverture"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {op.coverUrl ? <img src={op.coverUrl} alt="" /> : null}
          <span className={styles.pill}>
            <CameraIcon />
            {op.coverUrl ? "Changer" : "Une photo de vos sorties"}
          </span>
          {uploading === "cover" ? (
            <span className={styles.busy}>
              <Spinner size={22} label="Envoi de la photo" />
            </span>
          ) : null}
        </button>
        <input
          ref={coverInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload("cover", f);
          }}
        />

        <button type="button" className={styles.badge} onClick={() => logoInput.current?.click()} aria-label={op.logoUrl ? "Changer le logo" : "Ajouter votre logo"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {op.logoUrl ? <img src={op.logoUrl} alt="" /> : <span>{(op.name.trim()[0] ?? "L").toUpperCase()}</span>}
          <i className={styles.badgeMark}>{op.logoUrl ? <CameraIcon /> : "+"}</i>
          {uploading === "logo" ? (
            <span className={styles.busy}>
              <Spinner size={20} label="Envoi du logo" />
            </span>
          ) : null}
        </button>
        <input
          ref={logoInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) void upload("logo", f);
          }}
        />

        <div className={styles.id}>
          <h2>{op.name}</h2>
          {editTag ? (
            <input
              className={styles.tagIn}
              id="obTagline"
              maxLength={90}
              defaultValue={tagline}
              aria-label="Phrase sous le nom"
              autoFocus
              onFocus={(e) => e.target.select()}
              onBlur={(e) => saveTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                if (e.key === "Escape") setEditTag(false);
              }}
            />
          ) : (
            <p className={styles.tagWrap}>
              <button type="button" className={styles.tag} onClick={() => setEditTag(true)} aria-label="Modifier la phrase sous le nom">
                {tagline}
                <PenIcon />
              </button>
            </p>
          )}
        </div>
      </div>

      {error ? <p className={styles.err}>{error}</p> : null}
      <div className={styles.foot}>
        <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={onNext} disabled={uploading !== null}>
          Continuer
        </button>
      </div>
    </div>
  );
}

/* ── 4. Vos prix : le lot, et l'unité si le pro le veut ────────────── */
function StepPrices({
  op,
  busy,
  error,
  onSubmit,
}: {
  op: OnboardingOperator;
  busy: boolean;
  error: string | null;
  onSubmit: (patch: { priceAllCents: number; pricePhotoCents: number; packOnly: boolean }) => Promise<void>;
}) {
  const [all, setAll] = useState(euros(op.priceAllCents));
  const [one, setOne] = useState(euros(op.pricePhotoCents));
  const [unit, setUnit] = useState(!op.packOnly);
  const [local, setLocal] = useState<string | null>(null);
  const oneRef = useRef<HTMLInputElement>(null);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    const allCents = cents(all);
    const oneCents = cents(one);
    if (allCents === null) {
      setLocal("Le prix du lot doit être un montant en euros, par exemple 39.");
      return;
    }
    if (unit && oneCents === null) {
      setLocal("Le prix d'une photo doit être un montant en euros, par exemple 8.");
      return;
    }
    setLocal(null);
    void onSubmit({ priceAllCents: allCents, pricePhotoCents: oneCents ?? op.pricePhotoCents, packOnly: !unit });
  }

  return (
    <form className={styles.scr} onSubmit={submit} noValidate>
      <h1>Vos prix.</h1>
      <p className={styles.lede}>Ce que paie un client pour ses photos d&rsquo;une sortie.</p>
      <div className={styles.pxList}>
        <label className={styles.px} htmlFor="obAll">
          <span className={styles.pxTxt}>
            <b>Toutes ses photos</b>
            <small>Le lot complet de sa sortie</small>
          </span>
          <span className={styles.pxV}>
            <input id="obAll" inputMode="decimal" value={all} onChange={(e) => setAll(e.target.value)} aria-label="Prix de toutes ses photos, en euros" />
            <em>€</em>
          </span>
        </label>
        <div className={styles.pxOpt}>
          <button
            type="button"
            className={styles.pxTog}
            role="switch"
            aria-checked={unit}
            onClick={() => {
              setUnit(!unit);
              if (!unit) setTimeout(() => oneRef.current?.focus(), 30);
            }}
          >
            <span className={styles.pxTxt}>
              <b>Vendre aussi à l&rsquo;unité</b>
              <small>Le client peut ne prendre que certaines photos</small>
            </span>
            <i className={`${styles.sw} ${unit ? styles.swOn : ""}`} aria-hidden="true" />
          </button>
          {unit ? (
            <label className={styles.pxSub} htmlFor="obOne">
              <span className={styles.pxTxt}>
                <b>Une photo</b>
                <small>Le total ne dépasse jamais le prix du lot</small>
              </span>
              <span className={styles.pxV}>
                <input ref={oneRef} id="obOne" inputMode="decimal" value={one} onChange={(e) => setOne(e.target.value)} aria-label="Prix d'une photo, en euros" />
                <em>€</em>
              </span>
            </label>
          ) : null}
        </div>
      </div>
      {local || error ? <p className={styles.err}>{local ?? error}</p> : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Enregistrement" /> : null}
          {busy ? "Enregistrement…" : "Continuer"}
        </button>
      </div>
    </form>
  );
}

/* ── 5. Paiements : l'inscription Stripe, dans la page ─────────────── */
function StepPayments({ onReady, onLater }: { onReady: () => void; onLater: () => void }) {
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <div className={styles.scr}>
      <h1>Recevez vos paiements.</h1>
      <p className={styles.lede}>
        Les paiements arrivent sur votre compte Stripe, jamais sur le nôtre. Quelques minutes, avec une pièce d&rsquo;identité et votre IBAN.
      </p>
      {pending ? (
        <>
          <p className={styles.info}>
            Stripe a encore besoin d&rsquo;informations, ou vérifie celles que vous avez données. Vous pouvez reprendre maintenant, ou continuer et
            terminer avant de publier.
          </p>
          <div className={styles.foot}>
            <button
              type="button"
              className={`${styles.btn} ${styles.sec}`}
              onClick={() => {
                setPending(false);
                setAttempt(attempt + 1);
              }}
            >
              Reprendre avec Stripe
            </button>
            <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={onLater}>
              Continuer
            </button>
          </div>
        </>
      ) : (
        <>
          <div className={styles.stripeBox}>
            <StripeOnboarding key={attempt} onDone={(ready) => (ready ? onReady() : setPending(true))} />
          </div>
          <div className={styles.foot}>
            <button type="button" className={styles.link} onClick={onLater}>
              Plus tard, je le ferai avant de publier
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ── 6. Première sortie ─────────────────────────────────────────────── */
function StepSortie({ activities }: { activities: string[] }) {
  const router = useRouter();
  const labels = (() => {
    const list = ACTIVITIES.filter((a) => a.id !== "autre" && activities.includes(a.id)).map((a) => a.label);
    return list.length > 0 ? list : ACTIVITIES.filter((a) => activities.includes(a.id)).map((a) => a.label);
  })();
  const [activity, setActivity] = useState(labels[0] ?? "Sortie");
  const [day, setDay] = useState<DayChoice>("today");
  const [other, setOther] = useState(localDate(new Date()));
  const [time, setTime] = useState("09:00");
  const [mode, setMode] = useState<"GROUPE" | "INDIVIDUEL">("GROUPE");
  const [showMode, setShowMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(): Promise<void> {
    if (busy) return;
    const d = new Date();
    if (day === "tomorrow") d.setDate(d.getDate() + 1);
    const date = day === "other" ? other : localDate(d);
    if (!date) {
      setError("Il manque la date.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sorties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activity, startsAt: new Date(`${date}T${time || "09:00"}:00`).toISOString(), mode }),
      });
      if (!res.ok) throw new Error("failed");
      const { sortieId } = (await res.json()) as { sortieId: string };
      gtmEvent("sortie_created", { source: "onboarding", mode });
      router.push(`/sorties/${sortieId}`);
      router.refresh();
    } catch {
      setError(NETWORK);
      setBusy(false);
    }
  }

  return (
    <div className={styles.scr}>
      <h1>Votre première sortie.</h1>
      <p className={styles.lede}>Celle d&rsquo;aujourd&rsquo;hui, ou la prochaine. Vous déposerez les photos sur l&rsquo;écran suivant.</p>

      {labels.length > 1 ? (
        <>
          <p className={styles.lbl}>Activité</p>
          <div className={styles.chips}>
            {labels.map((l) => (
              <button key={l} type="button" className={`${styles.chip} ${l === activity ? styles.chipOn : ""}`} aria-pressed={l === activity} onClick={() => setActivity(l)}>
                {l}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <p className={styles.lbl}>Quand</p>
      <div className={styles.seg}>
        {(
          [
            ["today", "Aujourd'hui"],
            ["tomorrow", "Demain"],
            ["other", "Autre date"],
          ] as [DayChoice, string][]
        ).map(([key, label]) => (
          <button key={key} type="button" className={day === key ? styles.segOn : undefined} aria-pressed={day === key} onClick={() => setDay(key)}>
            {label}
          </button>
        ))}
      </div>
      {day === "other" ? (
        <div className={styles.row}>
          <label htmlFor="obDate">Date</label>
          <input id="obDate" type="date" value={other} onChange={(e) => setOther(e.target.value)} />
        </div>
      ) : null}
      <div className={styles.row}>
        <label htmlFor="obTime">Heure de départ</label>
        <input id="obTime" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>

      <div className={styles.mode}>
        <LinkIcon />
        <span>
          {mode === "GROUPE" ? "Un lien pour tout le groupe, affiché au retour." : "Une galerie par client, envoyée par e-mail."}{" "}
          <button type="button" className={styles.link} onClick={() => setShowMode(!showMode)}>
            {showMode ? "Fermer" : "Changer"}
          </button>
        </span>
      </div>
      {showMode ? (
        <div className={styles.picks}>
          <button
            type="button"
            className={`${styles.pick} ${mode === "GROUPE" ? styles.pickOn : ""}`}
            aria-pressed={mode === "GROUPE"}
            onClick={() => {
              setMode("GROUPE");
              setShowMode(false);
            }}
          >
            <b>Un lien pour tout le monde</b>
            <span>Vous montrez le QR code au retour. Chacun retrouve son créneau. Rien à saisir.</span>
          </button>
          <button
            type="button"
            className={`${styles.pick} ${mode === "INDIVIDUEL" ? styles.pickOn : ""}`}
            aria-pressed={mode === "INDIVIDUEL"}
            onClick={() => {
              setMode("INDIVIDUEL");
              setShowMode(false);
            }}
          >
            <b>Chacun sa galerie</b>
            <span>Vous notez l&rsquo;e-mail de chaque client. Plus long, mais nominatif.</span>
          </button>
        </div>
      ) : null}

      {error ? <p className={styles.err}>{error}</p> : null}
      <div className={styles.foot}>
        <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={() => void create()} disabled={busy}>
          {busy ? <Spinner size={16} tone="current" label="Création" /> : null}
          {busy ? "Création…" : "Créer la sortie"}
        </button>
      </div>
    </div>
  );
}
