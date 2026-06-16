"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { defaultGalleryTitle, renderDeliveryMessage } from "@/lib/message-templates";

const inputClass =
  "h-12 rounded-control border border-border bg-surface px-3.5 text-base text-ink outline-none focus:border-accent focus:ring-1 focus:ring-accent";

export function DeliverySendForm({
  deliveryId,
  operatorName,
  messageTemplate,
  initialName,
  initialEmail,
  initialPhone,
  initialTitle,
}: {
  deliveryId: string;
  operatorName: string;
  messageTemplate: string | null;
  initialName: string | null;
  initialEmail: string | null;
  initialPhone: string | null;
  initialTitle: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [title, setTitle] = useState(initialTitle ?? defaultGalleryTitle(initialName ?? ""));
  const [titleTouched, setTitleTouched] = useState(Boolean(initialTitle));
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // Tant que l'opérateur n'a pas personnalisé le titre, on le garde synchronisé avec le prénom saisi.
  useEffect(() => {
    if (!titleTouched) setTitle(defaultGalleryTitle(name));
  }, [name, titleTouched]);

  const preview = useMemo(
    () => renderDeliveryMessage(messageTemplate, { clientName: name.split(/\s+/)[0] || "", operatorName }),
    [messageTemplate, name, operatorName],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    if (!email && !phone) {
      setError("Indique au moins un email ou un numéro de téléphone.");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: name || null,
          clientEmail: email || null,
          clientPhone: phone || null,
          title: title || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "L'envoi a échoué — réessaie.");
        setStatus("error");
        return;
      }

      setStatus("done");
    } catch {
      setError("Le réseau a coupé — tes fichiers continuent d'envoyer, réessaie dans une minute.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col gap-3 rounded-card border border-success bg-success-tint p-5 text-center">
        <p className="text-base font-semibold text-ink">C&apos;est envoyé ! 🎉</p>
        <p className="text-sm text-ink-2">
          {email && phone
            ? "Le client va recevoir un email et un SMS avec sa galerie."
            : email
              ? "Le client va recevoir un email avec sa galerie."
              : "Le client va recevoir un SMS avec sa galerie."}
        </p>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => router.push(`/sessions/${deliveryId}/qr`)}
            className="flex h-12 items-center justify-center rounded-control border border-border-strong text-sm font-semibold text-ink transition hover:border-accent active:scale-[0.99]"
          >
            Afficher le QR (au cas où)
          </button>
          <button
            type="button"
            onClick={() => router.push("/sessions")}
            className="flex h-14 items-center justify-center rounded-control bg-accent text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99]"
          >
            Nouvelle livraison
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Prénom et nom"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className={inputClass}
      />
      <input
        type="email"
        inputMode="email"
        placeholder="Email du client"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        className={inputClass}
      />
      <input
        type="tel"
        inputMode="tel"
        placeholder="Numéro de téléphone (ex: +33 6 12 34 56 78)"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        className={inputClass}
      />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
        Titre de la galerie
        <input
          type="text"
          placeholder="Le vol de Léa 🤩"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setTitleTouched(true);
          }}
          className={inputClass}
        />
      </label>

      {(email || phone) && (
        <div className="rounded-control border border-border bg-canvas p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Aperçu du message</p>
          <p className="mt-1 text-sm text-ink-2">{preview}</p>
          <p className="mt-1 text-sm text-accent underline">souvenir.app/g/…</p>
        </div>
      )}

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex h-14 items-center justify-center rounded-control bg-accent text-base font-semibold text-white shadow-card transition hover:bg-accent-hover active:scale-[0.99] disabled:opacity-60"
      >
        {status === "loading" ? "Envoi en cours…" : "Envoyer les photos"}
      </button>
    </form>
  );
}
