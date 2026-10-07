"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { gtmEvent } from "@/lib/gtm";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { operatorTagline } from "@/lib/tagline";
import { Spinner } from "@/components/ui/Spinner";
import { Logo } from "@/components/brand/Logo";
import { StripeOnboarding } from "@/components/stripe/StripeOnboarding";
import { AccountForm } from "./AccountForm";
import styles from "./onboarding.module.css";

/*
 * L'inscription d'un pro, en sept écrans : compte, structure, activités, page, prix,
 * paiements, première sortie. Maquette : docs/maquette-onboarding-pro-v1.html.
 *
 * Chaque écran enregistre en partant. L'étape de départ est calculée par le
 * serveur (app/signup/page.tsx) à partir de ce qui existe déjà : un pro qui
 * ferme l'onglet reprend où il en était, sans rien stocker dans le navigateur.
 * La dernière étape crée la sortie et ouvre son écran dans l'espace pro, où
 * se font le dépôt des photos et la publication.
 */

export type OnboardingStep = "compte" | "structure" | "activites" | "page" | "prix" | "paiements" | "sortie";

const ORDER: OnboardingStep[] = ["compte", "structure", "activites", "page", "prix", "paiements", "sortie"];

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
  /** La commission Linktrip, pour dire au pro ce qu'il touche sur un lot. */
  feePercent: number;
  vatExempt: boolean;
  /** L'engagement sur le droit à l'image a déjà été pris. */
  imageRightsAcked: boolean;
}

/** L'identité légale retrouvée par le SIRET, envoyée avec la structure. */
interface LegalIdentity {
  siret: string;
  legalName: string;
  legalAddress: string;
}

interface SiretMatch {
  siret: string;
  name: string;
  legalForm: string | null;
  address: string | null;
  active: boolean;
}

/** Ce que l'écran « Votre structure » a retenu, en attendant les activités :
 *  la structure n'est créée qu'à la fin de l'écran suivant. */
interface StructureDraft {
  name: string;
  nameTouched: boolean;
  query: string;
  match: SiretMatch | null;
}

/** « 834 512 907 00018 » : le SIRET s'affiche par groupes pendant la saisie. */
function groupSiret(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9), d.slice(9)].filter(Boolean).join(" ");
}

/** Le texte que le pro colle dans ses confirmations de réservation. */
const CLIENT_NOTICE =
  "Pendant la sortie, nous prenons des photos. Elles vous seront proposées à l'achat dans une galerie privée, visible seulement par les participants de votre départ, sans obligation. Vous pouvez demander le retrait d'une photo à tout moment.";

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

/** « 31,20 € », « 39 € » : les centimes seulement quand il y en a. */
function euroLabel(c: number): string {
  return `${(c / 100).toLocaleString("fr-FR", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })} €`;
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
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
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
  const [draft, setDraft] = useState<StructureDraft | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  // « Autre » : l'activité en clair, tapée par le pro.
  const [other, setOther] = useState("");

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
  // Des activités, on revient à la structure : rien n'est encore créé. Une
  // fois la structure créée, on ne revient ni sur elle ni sur le compte : on
  // les corrige ensuite dans Réglages.
  const back: OnboardingStep | null =
    step === "activites"
      ? "structure"
      : index <= 3
        ? null
        : step === "sortie" && op?.stripeOnboarded
          ? "prix"
          : ORDER[index - 1]!;

  return (
    <div className={styles.ob}>
      <header className={styles.head}>
        <div className={styles.headLeft}>
          {back ? (
            <button type="button" className={styles.back} onClick={() => go(back)} aria-label="Retour">
              <BackIcon />
            </button>
          ) : null}
          {/* Le logo ne ramène à l'accueil qu'avant la création du compte :
              en cours d'inscription, un clic perdu ferait quitter le parcours. */}
          {step === "compte" ? (
            <Link href="/" className={styles.logo} aria-label="Linktrip, accueil">
              <Logo height={26} title={null} className={styles.logoFull} />
              <Logo variant="symbol" height={28} title={null} className={styles.logoMark} />
            </Link>
          ) : (
            <span className={styles.logo}>
              <Logo height={26} className={styles.logoFull} />
              <Logo variant="symbol" height={28} className={styles.logoMark} />
            </span>
          )}
        </div>
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
          <span aria-hidden="true" />
        )}
      </header>

      {step === "compte" ? (
        <AccountForm
          initialEmail={initialEmail}
          onSignedIn={() => {
            gtmEvent("sign_up", { method: "email", verification_pending: false });
            router.refresh();
          }}
        />
      ) : null}

      {step === "structure" ? (
        <StepStructure
          draft={draft}
          initialName={initialName}
          storeBase={storeBase}
          onNext={(next) => {
            setDraft(next);
            go("activites");
          }}
        />
      ) : null}

      {step === "activites" && draft ? (
        <StepActivites
          picked={picked}
          onPick={setPicked}
          other={other}
          onOther={setOther}
          busy={busy}
          error={error}
          onSubmit={async (activities) => {
            const otherActivity = activities.includes("autre") ? other.trim() : "";
            const name = draft.name.trim();
            const legal = legalOf(draft);
            setBusy(true);
            setError(null);
            try {
              const res = await fetch("/api/operator", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name,
                  qualification: { activities, ...(otherActivity ? { otherActivity } : {}) },
                  ...legal,
                }),
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
                feePercent: 20,
                vatExempt: false,
                imageRightsAcked: false,
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

      {step === "sortie" && op ? (
        <StepSortie activities={op.activities} otherActivity={op.activities.includes("autre") ? other.trim() : ""} imageRightsAcked={op.imageRightsAcked} />
      ) : null}
    </div>
  );
}

/** L'identité légale envoyée avec la structure : la fiche choisie, sinon le
 *  SIRET tel que tapé (l'annuaire a pu être en panne), sinon rien. */
function legalOf(draft: StructureDraft): Partial<LegalIdentity> {
  if (draft.match) return { siret: draft.match.siret, legalName: draft.match.name, legalAddress: draft.match.address ?? "" };
  const digits = draft.query.replace(/\D/g, "");
  return /^[\d\s]*$/.test(draft.query) && digits.length === 14 ? { siret: digits, legalName: "", legalAddress: "" } : {};
}

/** « 07150 Vallon-Pont-d'Arc » : la ville d'une adresse, pour la liste. */
function cityOf(address: string | null): string {
  return address?.match(/\d{5} .+$/)?.[0] ?? "";
}

/* ── 2. Structure : l'entreprise et le nom affiché ────────────────
   Le pro tape son SIRET ou le nom de son entreprise : l'annuaire des
   entreprises (données Sirene de l'INSEE) retrouve la raison sociale et
   l'adresse, qui figureront sur les reçus des clients (le pro est le
   vendeur). Facultatif : un pro peut s'inscrire avant d'être immatriculé.
   Rien n'est créé ici, la structure part avec les activités. */
function StepStructure({
  draft,
  initialName,
  storeBase,
  onNext,
}: {
  draft: StructureDraft | null;
  initialName: string;
  storeBase: string;
  onNext: (draft: StructureDraft) => void;
}) {
  const [name, setName] = useState(draft?.name ?? initialName);
  const [nameTouched, setNameTouched] = useState(draft?.nameTouched ?? !!initialName);
  const [query, setQuery] = useState(draft?.query ?? "");
  const [match, setMatch] = useState<SiretMatch | null>(draft?.match ?? null);
  const [hits, setHits] = useState<SiretMatch[]>([]);
  const [lookup, setLookup] = useState<"idle" | "busy" | "none">("idle");
  const [local, setLocal] = useState<string | null>(null);
  // Lu à l'arrivée d'une réponse de l'annuaire, qui peut suivre une saisie du nom.
  const nameTouchedRef = useRef(nameTouched);
  nameTouchedRef.current = nameTouched;

  // Que des chiffres : c'est un numéro (SIRET, ou SIREN à neuf chiffres).
  // Sinon, c'est un nom.
  const numeric = /^[\d\s]*$/.test(query);
  const digits = numeric ? query.replace(/\D/g, "") : "";

  useEffect(() => {
    // La fiche choisie est déjà là : rien à chercher.
    if (match && numeric && digits === match.siret) {
      setHits([]);
      setLookup("idle");
      return;
    }
    const text = query.trim();
    const bySiret = numeric && digits.length === 14;
    const byName = numeric ? digits.length === 9 : text.length >= 3;
    if (!bySiret && !byName) {
      setHits([]);
      setLookup("idle");
      return;
    }
    let cancelled = false;
    // Au fil de la frappe, une pause avant d'interroger l'annuaire ; un SIRET
    // complet part tout de suite.
    const timer = setTimeout(
      () => {
        setLookup("busy");
        const url = bySiret
          ? `/api/onboarding/siret?siret=${digits}`
          : `/api/onboarding/siret?q=${encodeURIComponent(numeric ? digits : text)}`;
        fetch(url)
          .then((res) => (res.ok ? (res.json() as Promise<{ match?: SiretMatch | null; matches?: SiretMatch[] }>) : {}))
          .then((body: { match?: SiretMatch | null; matches?: SiretMatch[] }) => {
            if (cancelled) return;
            if (bySiret) {
              const found = body.match ?? null;
              setHits([]);
              setLookup(found ? "idle" : "none");
              if (found) pick(found);
            } else {
              const list = body.matches ?? [];
              setHits(list);
              setLookup(list.length > 0 ? "idle" : "none");
            }
          })
          .catch(() => {
            if (!cancelled) setLookup("none");
          });
      },
      bySiret ? 0 : 350,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // pick ne lit que des setters et une ref : stable en pratique.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, match]);

  // Une fiche retenue : le champ montre son SIRET, et le nom affiché aux
  // clients se pré-remplit avec la raison sociale, tant que le pro ne l'a pas écrit.
  function pick(found: SiretMatch): void {
    setMatch(found);
    setQuery(groupSiret(found.siret));
    setHits([]);
    setLookup("idle");
    setLocal(null);
    if (!nameTouchedRef.current) setName(found.name);
  }

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (!match && numeric && digits.length > 0 && digits.length !== 14) {
      setLocal("Le SIRET compte 14 chiffres.");
      return;
    }
    if (name.trim().length < 2) {
      setLocal("Il manque le nom de la structure.");
      return;
    }
    setLocal(null);
    onNext({ name: name.trim(), nameTouched, query, match });
  }

  const open = hits.length > 0 && !match;

  return (
    <form className={styles.scr} onSubmit={submit} noValidate>
      <h1>Votre structure.</h1>
      <label className={styles.lbl} htmlFor="obSiret">
        Votre SIRET <small>ou le nom de votre entreprise</small>
      </label>
      <div className={`${styles.sirIn} ${match || open ? styles.sirFound : ""}`}>
        <input
          id="obSiret"
          className={styles.inp}
          autoComplete="off"
          spellCheck={false}
          placeholder="123 456 789 00012 ou Eaux Vives Ardèche"
          value={query}
          role="combobox"
          aria-expanded={open}
          aria-controls="obSiretHits"
          aria-autocomplete="list"
          onChange={(e) => {
            const v = e.target.value;
            setQuery(/^[\d\s]*$/.test(v) ? groupSiret(v) : v);
            setMatch(null);
            setLocal(null);
          }}
          autoFocus
        />
        <span className={styles.sirState} aria-hidden="true">
          {lookup === "busy" ? <Spinner size={16} /> : match ? <span className={styles.fok}><CheckIcon /></span> : null}
        </span>
      </div>
      {match ? (
        <div className={styles.found} aria-live="polite">
          <b>{match.name}</b>
          <span>
            {match.legalForm ? `${match.legalForm} · ` : ""}
            {/* Le code postal et la ville ne se séparent pas : « Vallon-Pont-d'Arc » se coupait au trait d'union. */}
            {match.address?.replace(/(\d{5} .+)$/, "") ?? ""}
            {match.address?.match(/\d{5} .+$/) ? <span className={styles.nw}>{match.address.match(/\d{5} .+$/)![0]}</span> : null}
          </span>
          <small>{match.active ? "Entreprise active" : "Établissement fermé"} · Annuaire des entreprises</small>
        </div>
      ) : open ? (
        <ul id="obSiretHits" className={styles.hits} role="listbox" aria-label="Entreprises trouvées">
          {hits.map((h) => (
            <li key={h.siret} role="option" aria-selected={false}>
              <button type="button" onClick={() => pick(h)}>
                <b>{h.name}</b>
                <span>
                  {cityOf(h.address) ? <span className={styles.nw}>{cityOf(h.address)}</span> : null}
                  {cityOf(h.address) ? " · " : ""}
                  <span className={styles.nw}>{groupSiret(h.siret)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : lookup === "none" ? (
        <p className={styles.info} aria-live="polite">
          {numeric
            ? "Ce numéro n\u2019est pas dans l\u2019annuaire des entreprises. Vérifiez-le, ou continuez : vous pourrez le corriger dans Réglages."
            : "Aucune entreprise active à ce nom. Essayez votre SIRET, ou continuez : vous l\u2019ajouterez dans Réglages."}
        </p>
      ) : null}

      <label className={styles.lbl} htmlFor="obName">
        Le nom que voient vos clients
      </label>
      <input
        id="obName"
        className={styles.inp}
        value={name}
        autoComplete="organization"
        placeholder="Eaux Vives Ardèche"
        onChange={(e) => {
          setName(e.target.value);
          setNameTouched(true);
        }}
      />
      <p className={styles.url}>
        <LinkIcon />
        <span>
          {storeBase}
          {slugify(name)}
        </span>
      </p>
      {local ? <p className={styles.err}>{local}</p> : null}
      <div className={styles.foot}>
        <button type="submit" className={`${styles.btn} ${styles.pri}`}>
          Continuer
        </button>
        {!match && query.trim() === "" ? (
          <p className={styles.legal}>Pas encore immatriculé ? Continuez sans SIRET, vous l&rsquo;ajouterez dans Réglages. Il figure sur les reçus de vos clients.</p>
        ) : null}
      </div>
    </form>
  );
}

/* ── 2 bis. Activités : ce que propose la structure ───────────────
   Elles servent à la phrase de la page et aux noms de sortie proposés.
   La structure est créée à la fin de cet écran. */
function StepActivites({
  picked,
  onPick,
  other,
  onOther,
  busy,
  error,
  onSubmit,
}: {
  picked: string[];
  onPick: (picked: string[]) => void;
  other: string;
  onOther: (other: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: (activities: string[]) => Promise<void>;
}) {
  const [local, setLocal] = useState<string | null>(null);

  function submit(e: React.FormEvent): void {
    e.preventDefault();
    if (picked.length === 0) {
      setLocal("Choisissez au moins une activité.");
      return;
    }
    if (picked.includes("autre") && other.trim().length < 2) {
      setLocal("Précisez votre activité.");
      return;
    }
    setLocal(null);
    void onSubmit(picked);
  }

  return (
    <form className={styles.scr} onSubmit={submit} noValidate>
      <h1>Vos activités.</h1>
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
              onClick={() => {
                onPick(on ? picked.filter((id) => id !== a.id) : [...picked, a.id]);
                setLocal(null);
              }}
            >
              {a.label}
            </button>
          );
        })}
      </div>
      {picked.includes("autre") ? (
        <>
          <label className={styles.lbl} htmlFor="obOther">
            Laquelle ?
          </label>
          <input
            id="obOther"
            className={styles.inp}
            value={other}
            maxLength={60}
            autoComplete="off"
            placeholder="Spéléologie, char à voile…"
            onChange={(e) => {
              onOther(e.target.value);
              setLocal(null);
            }}
            autoFocus
          />
        </>
      ) : null}
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
  onSubmit: (patch: { priceAllCents: number; pricePhotoCents: number; packOnly: boolean; vatExempt: boolean }) => Promise<void>;
}) {
  const [all, setAll] = useState(euros(op.priceAllCents));
  const [one, setOne] = useState(euros(op.pricePhotoCents));
  const [unit, setUnit] = useState(!op.packOnly);
  const [vatExempt, setVatExempt] = useState(op.vatExempt);
  // Ce que touche le pro sur un lot, à partir du prix en cours de saisie.
  const allNow = cents(all);
  const netCents = allNow === null ? null : Math.round((allNow * (100 - op.feePercent)) / 100);
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
    void onSubmit({ priceAllCents: allCents, pricePhotoCents: oneCents ?? op.pricePhotoCents, packOnly: !unit, vatExempt });
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
        <div className={styles.pxOpt}>
          <button type="button" className={styles.pxTog} role="switch" aria-checked={vatExempt} onClick={() => setVatExempt(!vatExempt)}>
            <span className={styles.pxTxt}>
              <b>Franchise de TVA</b>
              <small>Mention « TVA non applicable » sur vos reçus</small>
            </span>
            <i className={`${styles.sw} ${vatExempt ? styles.swOn : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>
      {/* La commission dite avant la première vente, en euros, sur son prix. */}
      {netCents !== null && allNow ? (
        <div className={styles.net}>
          <span>Vous recevez par lot</span>
          <b>{euroLabel(netCents)}</b>
          <small>
            Sur {euroLabel(allNow)}, Linktrip prend {op.feePercent} %. Les frais Stripe s&rsquo;appliquent au paiement.
          </small>
        </div>
      ) : null}
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
function StepSortie({
  activities,
  otherActivity,
  imageRightsAcked,
}: {
  activities: string[];
  /** L'activité précisée sous « Autre », proposée comme nom de sortie à la place du mot « Autre ». */
  otherActivity: string;
  imageRightsAcked: boolean;
}) {
  const router = useRouter();
  const labels = (() => {
    const list = ACTIVITIES.filter((a) => a.id !== "autre" && activities.includes(a.id)).map((a) => a.label);
    if (otherActivity) list.push(otherActivity.charAt(0).toUpperCase() + otherActivity.slice(1));
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
  // L'engagement sur le droit à l'image : coché une fois, il ne se redemande pas.
  const [ack, setAck] = useState(imageRightsAcked);
  const [copied, setCopied] = useState(false);

  async function copyNotice(): Promise<void> {
    try {
      await navigator.clipboard.writeText(CLIENT_NOTICE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(false);
    }
  }

  async function create(): Promise<void> {
    if (busy) return;
    if (!ack) {
      setError("Cochez l'engagement sur le droit à l'image pour créer la sortie.");
      return;
    }
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
      if (!imageRightsAcked && !(await patchSettings({ imageRightsAck: true }))) throw new Error("ack");
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
            <span>Vous montrez le QR code au retour. Chacun retrouve son créneau.</span>
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

      {/* Le pro prend les photos : c'est à lui de prévenir ses clients et de
          retirer une photo à la demande. L'engagement est daté
          (Operator.imageRightsAckAt), et le texte à transmettre est prêt. */}
      <div className={styles.eng}>
        {imageRightsAcked ? null : (
          <label className={styles.chk}>
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => {
                setAck(e.target.checked);
                setError(null);
              }}
            />
            <span className={styles.box} aria-hidden="true">
              <CheckIcon />
            </span>
            <span>Je préviens mes clients, avant la sortie, que des photos sont prises et proposées à la vente. Je retire toute photo sur demande.</span>
          </label>
        )}
        <button type="button" className={styles.cp} onClick={() => void copyNotice()}>
          <CopyIcon />
          {copied ? "Texte copié" : "Copier le texte pour vos réservations"}
        </button>
      </div>

      {error ? <p className={styles.err}>{error}</p> : null}
      <div className={styles.foot}>
        <button type="button" className={`${styles.btn} ${styles.pri}`} onClick={() => void create()} disabled={busy || !ack}>
          {busy ? <Spinner size={16} tone="current" label="Création" /> : null}
          {busy ? "Création…" : "Créer la sortie"}
        </button>
        <button
          type="button"
          className={styles.link}
          disabled={busy}
          onClick={() => {
            // Rien ne renvoie ici un pro sans sortie : /sorties l'accueille
            // avec son écran vide, qui propose de créer la première.
            gtmEvent("sortie_skipped", { source: "onboarding" });
            router.push("/sorties");
            router.refresh();
          }}
        >
          Passer cette étape
        </button>
      </div>
    </div>
  );
}
