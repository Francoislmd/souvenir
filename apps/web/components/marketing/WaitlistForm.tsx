"use client";

import { useState, type FormEvent } from "react";
import { inputClass } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import styles from "@/app/(marketing)/landing.module.css";
import { trackEvent } from "@/lib/marketing-analytics";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const selectClass = cx(
  inputClass,
  "appearance-none cursor-pointer bg-no-repeat bg-[right_14px_center] pr-9",
  "bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2212%22%20height=%228%22%3E%3Cpath%20d=%22M1%201l5%205%205-5%22%20stroke=%22%238A8496%22%20stroke-width=%221.8%22%20fill=%22none%22%20stroke-linecap=%22round%22/%3E%3C/svg%3E')]",
);

const ACTIVITIES = [
  "Parapente",
  "Canyoning",
  "Rafting",
  "Surf",
  "Plongée",
  "Kayak",
  "VTT",
  "Via ferrata",
  "Jet ski / nautisme",
  "Parc aventure",
  "Ski & montagne",
  "Autre",
];

const YEARLY_GUESTS = ["Moins de 500", "500 à 2 000", "2 000 à 5 000", "5 000 à 15 000", "Plus de 15 000"];

const PHOTO_USAGE = [
  "Rien, elles restent sur la carte",
  "Envoi manuel (WhatsApp, AirDrop, WeTransfer)",
  "Dossier partagé (Drive, Dropbox)",
  "Réseaux sociaux uniquement",
  "Je les vends déjà",
];

interface WaitlistFormProps {
  initialEmail?: string;
}

export function WaitlistForm({ initialEmail = "" }: WaitlistFormProps) {
  const [company, setCompany] = useState("");
  const [activity, setActivity] = useState("");
  const [yearlyGuests, setYearlyGuests] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [photoUsage, setPhotoUsage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, activity, yearlyGuests, photoUsage, website, source: "liste-attente" }),
      });
      if (!res.ok) throw new Error("waitlist submit failed");
      trackEvent("waitlist_submit", { photo_usage: photoUsage });
      setSuccess(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  const cardClass =
    "mx-auto w-full max-w-[640px] rounded-[clamp(18px,1.6vw,26px)] border border-line bg-white px-[clamp(20px,2.2vw,34px)] py-[clamp(20px,3vh,34px)] shadow-[0_30px_60px_-34px_rgba(22,19,32,0.34)]";

  if (success) {
    return (
      <div className={cx(cardClass, "py-[clamp(26px,5vh,54px)] text-center")}>
        <div className="mx-auto mb-[18px] flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[image:var(--sunset)] shadow-[0_10px_26px_-9px_rgba(255,90,31,0.6)]">
          <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7.5" />
          </svg>
        </div>
        <h2 className="font-display text-[clamp(22px,1.4vw+0.8vh,30px)] font-bold tracking-tight text-ink">C&apos;est noté.</h2>
        <p className="mx-auto mt-2.5 max-w-[380px] text-[15px] text-ink-2">
          Vous recevrez un e-mail à l&apos;ouverture, avec vos 3 mois sans commission activés.
        </p>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-x-[clamp(14px,1.6vw,22px)] gap-y-[clamp(12px,1.8vh,18px)] sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-company" className="text-[12.5px] font-semibold text-ink-2">
            Votre structure
          </label>
          <input id="wl-company" className={inputClass} placeholder="Grand Large Parapente" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-activity" className="text-[12.5px] font-semibold text-ink-2">
            Activité principale
          </label>
          <select id="wl-activity" className={selectClass} value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="">Sélectionnez</option>
            {ACTIVITIES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-guests" className="text-[12.5px] font-semibold text-ink-2">
            Participants par an
          </label>
          <select id="wl-guests" className={selectClass} value={yearlyGuests} onChange={(e) => setYearlyGuests(e.target.value)}>
            <option value="">Sélectionnez</option>
            {YEARLY_GUESTS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-email" className="text-[12.5px] font-semibold text-ink-2">
            E-mail professionnel
          </label>
          <input
            id="wl-email"
            type="email"
            required
            className={inputClass}
            placeholder="vous@structure.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="wl-photo-usage" className="text-[12.5px] font-semibold text-ink-2">
            Aujourd&apos;hui, que faites-vous des photos de vos sorties&nbsp;?
          </label>
          <select id="wl-photo-usage" className={selectClass} value={photoUsage} onChange={(e) => setPhotoUsage(e.target.value)}>
            <option value="">Sélectionnez</option>
            {PHOTO_USAGE.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.hp} aria-hidden="true">
          <label htmlFor="wl-website">Ne pas remplir</label>
          <input id="wl-website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" variant="sunset" size="lg" disabled={submitting} className="mt-1 w-full">
            {submitting ? "…" : <>Rejoindre la liste d&apos;attente <span aria-hidden="true">→</span></>}
          </Button>
          <p className="mt-2.5 text-center text-xs text-ink-4">Aucune carte bancaire · Aucun engagement</p>
          {error && <p className="mt-2 text-center text-sm text-danger">Une erreur est survenue, réessayez.</p>}
        </div>
      </form>
    </div>
  );
}

export default WaitlistForm;
