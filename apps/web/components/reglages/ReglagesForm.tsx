"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { AppHeader } from "@/components/operator/AppHeader";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/operator/ToastProvider";
import { StripeConnectSection } from "@/components/reglages/StripeConnectSection";
import { ACTIVITIES } from "@/lib/onboarding/activities";
import { operatorTagline } from "@/lib/tagline";
import { buttonColor } from "@/lib/color";
import { REDUCED_OFFER_DISCOUNT_PERCENT } from "@/lib/pricing";

const SWATCHES = ["#FF5A1F", "#0FBEB6", "#FF3D6E", "#7C3AED", "#2563EB", "#16A34A", "#0F0D16"];
// Ce que le lecteur d'écran annonce : un code hexadécimal ne dit rien.
const SWATCH_NAMES: Record<string, string> = {
  "#FF5A1F": "Orange",
  "#0FBEB6": "Turquoise",
  "#FF3D6E": "Rose",
  "#7C3AED": "Violet",
  "#2563EB": "Bleu",
  "#16A34A": "Vert",
  "#0F0D16": "Encre",
};

interface Automations {
  resendUnopened: boolean;
  reducedPriceOffer: boolean;
  reviewRequest: boolean;
}

interface OperatorSettings {
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  brandColor: string;
  tagline: string | null;
  pricePhotoCents: number;
  priceAllCents: number;
  packOnly: boolean;
  feePercent: number;
  stripeOnboarded: boolean;
  activities: string[];
  automations: Automations;
  legalName: string;
  legalAddress: string;
  siret: string;
  vatExempt: boolean;
}

type Patch = Record<string, unknown>;

function toEuros(cents: number): string {
  return (cents / 100).toString();
}

function CheckIcon({ size = 14, width = 2.6 }: { size?: number; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function UploadIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4M8 8l4-4 4 4" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

/** Une ligne à interrupteur, dans un cadre de liste (.rgList). */
function SwitchRow({
  title,
  text,
  when,
  checked,
  label,
  onToggle,
}: {
  title: string;
  text: string;
  when?: string;
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <div className={styles.rgRow}>
      <span className={styles.rgRowMain}>
        {when ? <span className={styles.rgWhen}>{when}</span> : null}
        <b>{title}</b>
        <span>{text}</span>
      </span>
      <button type="button" className={`${styles.tog} ${checked ? styles.on : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={onToggle}>
        <i />
      </button>
    </div>
  );
}

/**
 * Réglages, refonte du 11/10/2026 (maquette docs/maquette-reglages-v1.html).
 * Une section = un intitulé et une phrase à gauche, ses champs à droite. Les
 * sections suivent l'ordre d'importance : la page client (avec son aperçu,
 * seul moyen de voir l'effet d'une couleur), les prix, les relances, les
 * paiements et reçus, les activités.
 */
export function ReglagesForm({ operator, storeUrl }: { operator: OperatorSettings; storeUrl: string }) {
  const router = useRouter();
  const toast = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(operator.name);
  const [logoUrl, setLogoUrl] = useState(operator.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [coverUrl, setCoverUrl] = useState(operator.coverUrl);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [brandColor, setBrandColor] = useState(operator.brandColor);
  const [pricePhoto, setPricePhoto] = useState(toEuros(operator.pricePhotoCents));
  const [priceAll, setPriceAll] = useState(toEuros(operator.priceAllCents));
  const [packOnly, setPackOnly] = useState(operator.packOnly);
  const [automations, setAutomations] = useState<Automations>(operator.automations);
  const [activities, setActivities] = useState<Set<string>>(
    // Une activité retirée du catalogue ne doit pas faire refuser l'enregistrement.
    () => new Set(operator.activities.filter((id) => ACTIVITIES.some((a) => a.id === id))),
  );
  const [legalName, setLegalName] = useState(operator.legalName);
  const [legalAddress, setLegalAddress] = useState(operator.legalAddress);
  const [siret, setSiret] = useState(operator.siret);
  const [vatExempt, setVatExempt] = useState(operator.vatExempt);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [copied, setCopied] = useState(false);

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
      toast("L'enregistrement a échoué, vérifiez votre connexion.");
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

  async function upload(kind: "logo" | "cover", file: File): Promise<void> {
    const setBusy = kind === "logo" ? setUploadingLogo : setUploadingCover;
    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/operator/${kind}`, { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast((body as { error?: string }).error ?? "L'envoi a échoué, réessayez.");
        return;
      }
      // Envoi d'abord, l'adresse obtenue part ensuite dans le même lot que
      // les autres réglages.
      if (kind === "logo") {
        const { logoUrl: url } = (await res.json()) as { logoUrl: string };
        setLogoUrl(url);
        queue({ logoUrl: url });
      } else {
        const { coverUrl: url } = (await res.json()) as { coverUrl: string };
        setCoverUrl(url);
        queue({ coverUrl: url });
      }
    } finally {
      setBusy(false);
    }
  }

  const siretDigits = siret.replace(/\s+/g, "");
  const siretBad = siretDigits !== "" && !/^\d{14}$/.test(siretDigits);
  const storeLabel = storeUrl.replace(/^https?:\/\//, "");
  const tagline = operator.tagline?.trim() || operatorTagline(Array.from(activities));
  const shownName = name.trim() || operator.name;

  const logoMark = logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt="" />
  ) : (
    shownName.slice(0, 2).toUpperCase()
  );

  return (
    <>
      <AppHeader
        title="Réglages"
        status={
          <span className={styles.rgStatus} aria-live="polite">
            {status === "saving" ? (
              <>
                <Spinner size={14} />
                Enregistrement…
              </>
            ) : status === "saved" ? (
              <>
                <CheckIcon size={15} />
                Enregistré
              </>
            ) : null}
          </span>
        }
      />

      <div className={styles.sWrap}>
        {/* Sans Stripe, rien ne se vend : c'est la seule chose qui passe
            avant tout le reste de la page. */}
        {operator.stripeOnboarded ? null : (
          <div className={styles.rgAlert}>
            <StripeConnectSection stripeOnboarded={false} />
          </div>
        )}

        {/* 1. La page client */}
        <section className={styles.rgSec} id="page-client" aria-labelledby="rg-h-page">
          <div className={styles.rgSecHead}>
            <h2 id="rg-h-page">Votre page client</h2>
            <p>Vos clients y arrivent depuis le QR code ou l&rsquo;e-mail de fin de sortie.</p>

            {/* L'aperçu reprend la page de store.linktrip.co/{slug}
                (components/store/LinkRequest.tsx) : une couleur ne se juge
                qu'appliquée. */}
            <div className={styles.rgPrev} aria-hidden="true" style={{ "--op-btn": buttonColor(brandColor) } as React.CSSProperties}>
              <div className={styles.rgPrevBar}>{storeLabel}</div>
              {coverUrl ? (
                <div className={styles.rgPCover} style={{ backgroundImage: `url(${coverUrl})` }}>
                  <div className={styles.rgPOrg}>
                    <span className={styles.rgPLogo}>{logoMark}</span>
                    <span>
                      <b>{shownName}</b>
                      {tagline ? <span>{tagline}</span> : null}
                    </span>
                  </div>
                </div>
              ) : null}
              <div className={`${styles.rgPSheet} ${coverUrl ? "" : styles.rgPSheetFlat}`}>
                {coverUrl ? null : (
                  <div className={`${styles.rgPOrg} ${styles.rgPOrgFlat}`}>
                    <span className={styles.rgPLogo}>{logoMark}</span>
                    <span>
                      <b>{shownName}</b>
                      {tagline ? <span>{tagline}</span> : null}
                    </span>
                  </div>
                )}
                <p className={styles.rgPH}>Retrouvez vos photos</p>
                <div className={styles.rgPLbl}>L&rsquo;adresse e-mail donnée à la réservation</div>
                <div className={styles.rgPIn}>prenom.nom@gmail.com</div>
                <div className={styles.rgPCta}>Recevoir mon lien</div>
              </div>
            </div>
          </div>

          <div className={styles.rgSecBody}>
            <div className={styles.rgField}>
              <label htmlFor="rgName">Nom affiché</label>
              <input
                id="rgName"
                className={styles.sdInp}
                value={name}
                autoComplete="organization"
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
              <span className={styles.rgLbl}>Logo et couleur</span>
              <div className={styles.rgBrandRow}>
                <button
                  type="button"
                  className={styles.rgLogoBtn}
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                  aria-label={logoUrl ? "Changer le logo" : "Ajouter un logo"}
                >
                  {uploadingLogo ? (
                    <Spinner size={18} />
                  ) : logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" />
                  ) : (
                    <UploadIcon size={20} />
                  )}
                </button>
                <span className={styles.rgVsep} aria-hidden="true" />
                <div className={styles.rgSws} role="group" aria-label="Couleur">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`${styles.rgSw} ${brandColor === c ? styles.rgSwOn : ""}`}
                      style={{ background: c }}
                      aria-label={SWATCH_NAMES[c] ?? c}
                      aria-pressed={brandColor === c}
                      onClick={() => {
                        setBrandColor(c);
                        queue({ brandColor: c });
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className={styles.rgHint}>Visibles sur vos galeries et dans vos e-mails.</span>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload("logo", file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className={styles.rgField}>
              <span className={styles.rgLbl}>Photo de couverture</span>
              <button
                type="button"
                className={styles.rgCover}
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                aria-label={coverUrl ? "Remplacer la photo de couverture" : "Ajouter une photo de couverture"}
              >
                {uploadingCover ? (
                  <span className={styles.rgCoverEmpty}>
                    <Spinner size={20} />
                  </span>
                ) : coverUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverUrl} alt="" />
                    <span className={styles.rgCoverAct}>
                      <UploadIcon />
                      Remplacer
                    </span>
                  </>
                ) : (
                  <span className={styles.rgCoverEmpty}>
                    <UploadIcon size={20} />
                    Ajouter une photo
                  </span>
                )}
              </button>
              <span className={styles.rgHint}>Format paysage.</span>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.hiddenInput}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload("cover", file);
                  e.target.value = "";
                }}
              />
            </div>

            <div className={styles.rgField}>
              <span className={styles.rgLbl}>Adresse</span>
              <div className={styles.rgCopy}>
                <span className={styles.rgCopyUrl}>{storeLabel}</span>
                <button
                  type="button"
                  className={styles.rgCopyBtn}
                  onClick={() => {
                    void navigator.clipboard.writeText(storeUrl).catch(() => undefined);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1600);
                  }}
                >
                  {copied ? (
                    <CheckIcon size={15} width={2.2} />
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="8.75" y="8.75" width="11.5" height="11.5" rx="2.5" />
                      <path d="M15.25 8.75v-2.5a2.5 2.5 0 0 0-2.5-2.5h-6.5a2.5 2.5 0 0 0-2.5 2.5v6.5a2.5 2.5 0 0 0 2.5 2.5h2.5" />
                    </svg>
                  )}
                  {copied ? "Copiée" : "Copier"}
                </button>
              </div>
              <span className={styles.rgHint}>
                Une seule adresse pour toutes vos sorties. Seuls les e-mails de votre liste reçoivent un lien.
              </span>
            </div>
          </div>
        </section>

        {/* 2. Les prix */}
        <section className={styles.rgSec} id="prix" aria-labelledby="rg-h-prix">
          <div className={styles.rgSecHead}>
            <h2 id="rg-h-prix">Vos prix</h2>
            <p>Linktrip prélève {operator.feePercent} % sur chaque vente. Les frais Stripe sont à votre charge.</p>
          </div>
          <div className={styles.rgSecBody}>
            <div className={styles.rgTwo}>
              <div className={styles.rgPrice}>
                <label htmlFor="rgPricePhoto">Une photo</label>
                <div className={styles.rgPriceIn}>
                  <input
                    id="rgPricePhoto"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={pricePhoto}
                    onChange={(e) => {
                      setPricePhoto(e.target.value);
                      queue({ pricePhotoCents: Math.round(Number(e.target.value || 0) * 100) });
                    }}
                  />
                  <em>€</em>
                </div>
                <span className={styles.rgNet}>
                  Vous recevez <b>{net(pricePhoto)} €</b>
                </span>
              </div>
              <div className={styles.rgPrice}>
                <label htmlFor="rgPriceAll">Toutes les photos</label>
                <div className={styles.rgPriceIn}>
                  <input
                    id="rgPriceAll"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.5"
                    value={priceAll}
                    onChange={(e) => {
                      setPriceAll(e.target.value);
                      queue({ priceAllCents: Math.round(Number(e.target.value || 0) * 100) });
                    }}
                  />
                  <em>€</em>
                </div>
                <span className={styles.rgNet}>
                  Vous recevez <b>{net(priceAll)} €</b>
                </span>
              </div>
            </div>
            <div className={styles.rgList}>
              <SwitchRow
                title="Vente à l'unité"
                text="Sans elle, vos clients ne prennent que le lot complet."
                checked={!packOnly}
                label="Vente à l'unité"
                onToggle={() => {
                  const next = !packOnly;
                  setPackOnly(next);
                  queue({ packOnly: next });
                }}
              />
            </div>
          </div>
        </section>

        {/* 3. Les relances */}
        <section className={styles.rgSec} id="relances" aria-labelledby="rg-h-relances">
          <div className={styles.rgSecHead}>
            <h2 id="rg-h-relances">Relances automatiques</h2>
            <p>Des messages envoyés à vos clients après chaque sortie publiée.</p>
          </div>
          <div className={styles.rgSecBody}>
            <div className={styles.rgList}>
              <SwitchRow
                when="2 h après"
                title="Lien pas encore ouvert"
                text="Nous renvoyons le lien de la galerie."
                checked={automations.resendUnopened}
                label="Renvoyer le lien"
                onToggle={() => toggleAutomation("resendUnopened")}
              />
              <SwitchRow
                when="Le lendemain"
                title="Galerie vue, rien acheté"
                text={`Nous proposons les photos à −${REDUCED_OFFER_DISCOUNT_PERCENT} %.`}
                checked={automations.reducedPriceOffer}
                label="Proposer une réduction"
                onToggle={() => toggleAutomation("reducedPriceOffer")}
              />
              <SwitchRow
                when="Après l'achat"
                title="Avis Google"
                text="Nous demandons un avis sur votre fiche Google."
                checked={automations.reviewRequest}
                label="Demander un avis Google"
                onToggle={() => toggleAutomation("reviewRequest")}
              />
            </div>
          </div>
        </section>

        {/* 4. Paiements et reçus. Le vendeur, c'est lui : son identité
            s'affiche sur la feuille de paiement et sur chaque reçu. Stripe
            remplit le nom et l'adresse quand il les connaît ; le SIRET se
            saisit ici. */}
        <section className={styles.rgSec} id="paiements" aria-labelledby="rg-h-paiements">
          <div className={styles.rgSecHead}>
            <h2 id="rg-h-paiements">Paiements et reçus</h2>
            <p>Ces informations figurent sur la page de paiement et sur chaque reçu.</p>
          </div>
          <div className={styles.rgSecBody}>
            {operator.stripeOnboarded ? <StripeConnectSection stripeOnboarded /> : null}
            <div className={styles.rgField}>
              <label htmlFor="rgLegalName">Raison sociale</label>
              <input
                id="rgLegalName"
                className={styles.sdInp}
                value={legalName}
                placeholder={name}
                autoComplete="organization"
                onChange={(e) => {
                  setLegalName(e.target.value);
                  queue({ legalName: e.target.value });
                }}
              />
            </div>
            <div className={styles.rgField}>
              <label htmlFor="rgLegalAddress">Adresse</label>
              <input
                id="rgLegalAddress"
                className={styles.sdInp}
                value={legalAddress}
                placeholder="4 chemin du Moulin, 04400 Barcelonnette"
                autoComplete="street-address"
                onChange={(e) => {
                  setLegalAddress(e.target.value);
                  queue({ legalAddress: e.target.value });
                }}
              />
            </div>
            <div className={styles.rgField}>
              <label htmlFor="rgSiret">SIRET</label>
              <input
                id="rgSiret"
                className={`${styles.sdInp} ${siretBad ? styles.rgInpBad : ""}`}
                value={siret}
                inputMode="numeric"
                placeholder="123 456 789 00012"
                aria-invalid={siretBad}
                aria-describedby="rgSiretHint"
                onChange={(e) => {
                  const value = e.target.value;
                  setSiret(value);
                  // L'API refuse un SIRET incomplet : on n'envoie que 14
                  // chiffres, ou un champ vidé.
                  const digits = value.replace(/\s+/g, "");
                  if (digits === "" || /^\d{14}$/.test(digits)) queue({ siret: value });
                }}
              />
              <span id="rgSiretHint" className={styles.rgHint}>
                {siretBad ? "Le SIRET compte 14 chiffres." : "14 chiffres."}
              </span>
            </div>
            <div className={styles.rgList}>
              <SwitchRow
                title="Franchise de TVA"
                text="Vos reçus portent « TVA non applicable, art. 293 B du CGI »."
                checked={vatExempt}
                label="Franchise de TVA"
                onToggle={() => {
                  const next = !vatExempt;
                  setVatExempt(next);
                  queue({ vatExempt: next });
                }}
              />
            </div>
          </div>
        </section>

        {/* 5. Les activités : légères quand elles sont cochées, la page n'a
            pas à être portée par elles. */}
        <section className={styles.rgSec} id="activites" aria-labelledby="rg-h-activites">
          <div className={styles.rgSecHead}>
            <h2 id="rg-h-activites">Vos activités</h2>
            <p>Proposées à la création d&rsquo;une sortie et affichées sous votre nom.</p>
          </div>
          <div className={styles.rgSecBody}>
            <div className={styles.rgChips}>
              {ACTIVITIES.map((a) => {
                const on = activities.has(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`${styles.rgChip} ${on ? styles.rgChipOn : ""}`}
                    aria-pressed={on}
                    onClick={() => toggleActivity(a.id)}
                  >
                    {on ? <CheckIcon /> : null}
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <footer className={styles.rgEnd}>Chaque modification s&rsquo;enregistre seule.</footer>
      </div>
    </>
  );
}
