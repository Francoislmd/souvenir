"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { AppHeader } from "@/components/operator/AppHeader";
import { useToast } from "@/components/operator/ToastProvider";
import { StripeConnectSection } from "@/components/reglages/StripeConnectSection";
import { ACTIVITIES } from "@/lib/onboarding/activities";

const SWATCHES = ["#FF5A1F", "#0FBEB6", "#FF3D6E", "#7C3AED", "#2563EB", "#16A34A", "#0F0D16"];

interface Automations {
  resendUnopened: boolean;
  reducedPriceOffer: boolean;
  reviewRequest: boolean;
}

interface OperatorSettings {
  name: string;
  logoUrl: string | null;
  brandColor: string;
  pricePhotoCents: number;
  priceAllCents: number;
  packOnly: boolean;
  feePercent: number;
  stripeOnboarded: boolean;
  activities: string[];
  automations: Automations;
}

type Patch = Record<string, unknown>;

function toEuros(cents: number): string {
  return (cents / 100).toString();
}

export function ReglagesForm({ operator }: { operator: OperatorSettings }) {
  const router = useRouter();
  const toast = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(operator.name);
  const [logoUrl, setLogoUrl] = useState(operator.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [brandColor, setBrandColor] = useState(operator.brandColor);
  const [pricePhoto, setPricePhoto] = useState(toEuros(operator.pricePhotoCents));
  const [priceAll, setPriceAll] = useState(toEuros(operator.priceAllCents));
  const [packOnly, setPackOnly] = useState(operator.packOnly);
  const [automations, setAutomations] = useState<Automations>(operator.automations);
  const [activities, setActivities] = useState<Set<string>>(new Set(operator.activities));
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Plus de bouton « Enregistrer » : les interrupteurs avaient l'air immédiats
  // alors qu'ils ne l'étaient pas. Les modifications partent seules, groupées,
  // et l'en-tête dit où elles en sont.
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    setStatus("saving");
    const res = await fetch("/api/operator/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      setStatus("saved");
      router.refresh();
    } else {
      setStatus("idle");
      toast("L'enregistrement a échoué — vérifiez votre connexion.");
    }
  }, [router, toast]);

  const queue = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 700);
    },
    [flush],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function toggleActivity(id: string): void {
    const next = new Set(activities);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setActivities(next);
    queue({ activities: Array.from(next) });
  }

  function toggleAutomation(key: keyof Automations): void {
    const next = { ...automations, [key]: !automations[key] };
    setAutomations(next);
    queue({ automations: next });
  }

  function net(euros: string): string {
    const cents = Math.round(Number(euros || 0) * 100);
    return ((cents * (100 - operator.feePercent)) / 100 / 100).toFixed(2).replace(".", ",");
  }

  async function handleLogoFile(file: File): Promise<void> {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/operator/logo", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        toast((body as { error?: string }).error ?? "L'envoi a échoué, réessayez.");
        return;
      }
      const { logoUrl: uploadedUrl } = (await uploadRes.json()) as { logoUrl: string };
      setLogoUrl(uploadedUrl);
      queue({ logoUrl: uploadedUrl });
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <>
      <AppHeader
        title="Réglages"
        status={
          <span className={styles.rgStatus} aria-live="polite">
            {status === "saving" ? (
              "Enregistrement…"
            ) : status === "saved" ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Enregistré
              </>
            ) : null}
          </span>
        }
      />

      <div className={styles.sWrap}>
        <div className={styles.rgCols}>
          <div>
            <p className={styles.sDay}>Ce que voient vos clients</p>

            <div className={styles.rgField}>
              <label htmlFor="rgName">Nom de la structure</label>
              <input
                id="rgName"
                className={styles.sdInp}
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);
                  // L'API refuse un nom de moins de deux lettres : on n'envoie
                  // pas les états intermédiaires d'une saisie en cours.
                  if (value.trim().length >= 2) queue({ name: value });
                }}
              />
            </div>

            <div className={styles.rgField}>
              <label>Logo et couleur</label>
              <div className={styles.rgLogo}>
                <button type="button" className={styles.rgLogoBtn} onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo} aria-label="Changer le logo">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" />
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 16V4M8 8l4-4 4 4" />
                      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                    </svg>
                  )}
                </button>
                <div className={styles.rgSws}>
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.rgSw} ${brandColor === c ? styles.rgSwOn : ""}`}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => {
                        setBrandColor(c);
                        queue({ brandColor: c });
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className={styles.rgHint}>Visibles sur la galerie et dans les emails.</span>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleLogoFile(file);
                  e.target.value = "";
                }}
              />
            </div>

            <p className={styles.sDay}>Vos prix</p>

            <div className={styles.rgField}>
              <div className={styles.rgPrice}>
                <span>Une photo</span>
                <input
                  type="number"
                  aria-label="Prix d'une photo"
                  value={pricePhoto}
                  onChange={(e) => {
                    setPricePhoto(e.target.value);
                    queue({ pricePhotoCents: Math.round(Number(e.target.value || 0) * 100) });
                  }}
                />
                <span className={styles.rgUnit}>€</span>
              </div>
              <span className={styles.rgHint}>
                Vous touchez {net(pricePhoto)} € — Linktrip prend {operator.feePercent} %.
              </span>
            </div>

            <div className={styles.rgField}>
              <div className={styles.rgPrice}>
                <span>Toutes les photos de la sortie</span>
                <input
                  type="number"
                  aria-label="Prix de toutes les photos"
                  value={priceAll}
                  onChange={(e) => {
                    setPriceAll(e.target.value);
                    queue({ priceAllCents: Math.round(Number(e.target.value || 0) * 100) });
                  }}
                />
                <span className={styles.rgUnit}>€</span>
              </div>
              <span className={styles.rgHint}>Vous touchez {net(priceAll)} €.</span>
            </div>

            <div className={styles.rgSwitch}>
              <span className={styles.rgSwitchMain}>
                <b>Vente à l&rsquo;unité</b>
                <span>Sans elle, vos clients ne peuvent prendre que le lot complet.</span>
              </span>
              <button
                type="button"
                className={`${styles.tog} ${!packOnly ? styles.on : ""}`}
                role="switch"
                aria-checked={!packOnly}
                aria-label="Vente à l'unité"
                onClick={() => {
                  const next = !packOnly;
                  setPackOnly(next);
                  queue({ packOnly: next });
                }}
              >
                <i />
              </button>
            </div>
          </div>

          <div>
            <p className={styles.sDay}>Vos activités</p>
            <div className={styles.shChips}>
              {ACTIVITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={`${styles.shChip} ${activities.has(a.id) ? styles.shChipOn : ""}`}
                  aria-pressed={activities.has(a.id)}
                  onClick={() => toggleActivity(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>

            <p className={styles.sDay}>On relance à votre place</p>
            <div className={styles.rgSwitch}>
              <span className={styles.rgSwitchMain}>
                <b>Ils n&rsquo;ont pas ouvert</b>
                <span>Deux heures après, on leur remet le lien. Ils sont souvent encore sur la route.</span>
              </span>
              <button
                type="button"
                className={`${styles.tog} ${automations.resendUnopened ? styles.on : ""}`}
                role="switch"
                aria-checked={automations.resendUnopened}
                aria-label="Relancer ceux qui n'ont pas ouvert"
                onClick={() => toggleAutomation("resendUnopened")}
              >
                <i />
              </button>
            </div>
            <div className={styles.rgSwitch}>
              <span className={styles.rgSwitchMain}>
                <b>Ils ont regardé sans acheter</b>
                <span>Le lendemain, on leur propose leurs photos à prix réduit. C&rsquo;est ce qui rapporte le plus.</span>
              </span>
              <button
                type="button"
                className={`${styles.tog} ${automations.reducedPriceOffer ? styles.on : ""}`}
                role="switch"
                aria-checked={automations.reducedPriceOffer}
                aria-label="Proposer un prix réduit"
                onClick={() => toggleAutomation("reducedPriceOffer")}
              >
                <i />
              </button>
            </div>
            <div className={styles.rgSwitch}>
              <span className={styles.rgSwitchMain}>
                <b>Ils ont acheté</b>
                <span>On leur demande un avis Google. Vos meilleures notes viennent de là.</span>
              </span>
              <button
                type="button"
                className={`${styles.tog} ${automations.reviewRequest ? styles.on : ""}`}
                role="switch"
                aria-checked={automations.reviewRequest}
                aria-label="Demander un avis"
                onClick={() => toggleAutomation("reviewRequest")}
              >
                <i />
              </button>
            </div>

            <StripeConnectSection stripeOnboarded={operator.stripeOnboarded} />

            <form action="/auth/signout" method="post">
              <button type="submit" className={styles.rgQuiet}>
                Se déconnecter
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
