"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/(operator)/operator.module.css";
import { useToast } from "@/components/operator/ToastProvider";
import { StripeConnectSection } from "@/components/reglages/StripeConnectSection";
import { ACTIVITIES } from "@/lib/onboarding/activities";

const SWATCHES = ["#FF5A1F", "#0FBEB6", "#FF3D6E", "#7C3AED", "#2563EB", "#16A34A", "#0F0D16"];

interface OperatorSettings {
  name: string;
  logoUrl: string | null;
  brandColor: string;
  pricePhotoCents: number;
  pricePackCents: number;
  priceAllCents: number;
  packSize: number;
  feePercent: number;
  stripeOnboarded: boolean;
  activities: string[];
  automations: { resendUnopened: boolean; reducedPriceOffer: boolean; reviewRequest: boolean };
}

function toEuros(cents: number): string {
  return (cents / 100).toString();
}

export function ReglagesForm({ operator }: { operator: OperatorSettings }) {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState(operator.name);
  const [logoUrl, setLogoUrl] = useState(operator.logoUrl);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [brandColor, setBrandColor] = useState(operator.brandColor);
  const [pricePhoto, setPricePhoto] = useState(toEuros(operator.pricePhotoCents));
  const [pricePack, setPricePack] = useState(toEuros(operator.pricePackCents));
  const [priceAll, setPriceAll] = useState(toEuros(operator.priceAllCents));
  const [automations, setAutomations] = useState(operator.automations);
  const [activities, setActivities] = useState<Set<string>>(new Set(operator.activities));
  const [saving, setSaving] = useState(false);

  function toggleActivity(id: string): void {
    setActivities((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function net(euros: string): string {
    const cents = Math.round(Number(euros || 0) * 100);
    return ((cents * (100 - operator.feePercent)) / 100 / 100).toFixed(2).replace(".", ",");
  }

  async function save(): Promise<void> {
    setSaving(true);
    const res = await fetch("/api/operator/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brandColor,
        pricePhotoCents: Math.round(Number(pricePhoto || 0) * 100),
        pricePackCents: Math.round(Number(pricePack || 0) * 100),
        priceAllCents: Math.round(Number(priceAll || 0) * 100),
        automations,
        activities: Array.from(activities),
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast("C'est enregistré");
      router.refresh();
    }
  }

  function toggle(key: keyof OperatorSettings["automations"]): void {
    setAutomations((a) => ({ ...a, [key]: !a[key] }));
  }

  async function handleLogoFile(file: File): Promise<void> {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/operator/logo", { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const body = await uploadRes.json().catch(() => ({}));
        toast((body as { error?: string }).error ?? "L'envoi a échoué, réessaie.");
        return;
      }
      const { logoUrl: uploadedUrl } = (await uploadRes.json()) as { logoUrl: string };
      const saveRes = await fetch("/api/operator/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl: uploadedUrl }),
      });
      if (!saveRes.ok) {
        toast("L'envoi a échoué, réessaie.");
        return;
      }
      setLogoUrl(uploadedUrl);
      toast("Logo mis à jour");
      router.refresh();
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <>
      <div className={styles.lbl} style={{ marginTop: 0 }}>
        Ce que voient vos clients
      </div>
      <div className={styles.field}>
        <label htmlFor="bName">Le nom de votre structure</label>
        <input className={styles.inp} id="bName" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label>Logo</label>
        <button type="button" className={styles.logoUpload} onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
          <span className={styles.logoPreview}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4M8 8l4-4 4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            )}
          </span>
          <span>
            <span className={styles.logoUploadTitle}>{uploadingLogo ? "Envoi…" : logoUrl ? "Changer le logo" : "Ajouter un logo"}</span>
            <span className={styles.logoUploadHint}>PNG, JPG, WEBP ou SVG — visible sur la galerie et les emails</span>
          </span>
        </button>
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
      <div className={styles.field}>
        <label>Couleur</label>
        <div className={styles.sws}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              className={`${styles.sw} ${brandColor === c ? styles.on : ""}`}
              style={{ background: c }}
              aria-label={c}
              onClick={() => setBrandColor(c)}
            />
          ))}
        </div>
      </div>

      <div className={styles.lbl}>Vos prix</div>
      <div className={styles.pr}>
        <span className={styles.a}>Photo seule</span>
        <span className={styles.net}>net {net(pricePhoto)} €</span>
        <input type="number" value={pricePhoto} onChange={(e) => setPricePhoto(e.target.value)} />
        <span>€</span>
      </div>
      <div className={styles.pr}>
        <span className={styles.a}>Pack {operator.packSize} photos</span>
        <span className={styles.net}>net {net(pricePack)} €</span>
        <input type="number" value={pricePack} onChange={(e) => setPricePack(e.target.value)} />
        <span>€</span>
      </div>
      <div className={styles.pr}>
        <span className={styles.a}>Toutes les photos</span>
        <span className={styles.net}>net {net(priceAll)} €</span>
        <input type="number" value={priceAll} onChange={(e) => setPriceAll(e.target.value)} />
        <span>€</span>
      </div>

      <div className={styles.lbl}>Vos activités</div>
      <div className={styles.acts}>
        {ACTIVITIES.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`${styles.ac} ${activities.has(a.id) ? styles.on : ""}`}
            aria-pressed={activities.has(a.id)}
            onClick={() => toggleActivity(a.id)}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className={styles.lbl}>On relance à votre place</div>
      <div className={styles.rel}>
        <div className={styles.ri}>
          <div className={styles.rt}>Ils n&rsquo;ont pas ouvert</div>
          <div className={styles.rh}>Deux heures après, on leur remet le lien. Ils sont souvent encore sur la route.</div>
        </div>
        <button type="button" className={`${styles.tog} ${automations.resendUnopened ? styles.on : ""}`} aria-label="Activer" onClick={() => toggle("resendUnopened")}>
          <i />
        </button>
      </div>
      <div className={styles.rel}>
        <div className={styles.ri}>
          <div className={styles.rt}>Ils ont regardé sans acheter</div>
          <div className={styles.rh}>Le lendemain, on leur propose le pack à prix réduit. C&rsquo;est ce qui rapporte le plus.</div>
        </div>
        <button type="button" className={`${styles.tog} ${automations.reducedPriceOffer ? styles.on : ""}`} aria-label="Activer" onClick={() => toggle("reducedPriceOffer")}>
          <i />
        </button>
      </div>
      <div className={styles.rel}>
        <div className={styles.ri}>
          <div className={styles.rt}>Ils ont acheté</div>
          <div className={styles.rh}>On leur demande un avis Google. Vos meilleures notes viennent de là.</div>
        </div>
        <button type="button" className={`${styles.tog} ${automations.reviewRequest ? styles.on : ""}`} aria-label="Activer" onClick={() => toggle("reviewRequest")}>
          <i />
        </button>
      </div>

      <StripeConnectSection stripeOnboarded={operator.stripeOnboarded} />

      <div style={{ marginTop: 22 }}>
        <button type="button" className={styles.btn} onClick={save} disabled={saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </>
  );
}
