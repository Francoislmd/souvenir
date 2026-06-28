"use client";

import { useState } from "react";
import Link from "next/link";
import { formatEuros, maskPhone } from "@/lib/format";
import type { Purchase } from "@/lib/metrics";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local!.slice(0, 2)}…@${domain}`;
}

export function PurchaseTable({ purchases, operatorFeePercent }: { purchases: Purchase[]; operatorFeePercent: number }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (purchases.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-2">Aucun achat pour l&apos;instant.</p>
    );
  }

  const operatorShare = 100 - operatorFeePercent;

  return (
    <div className="divide-y divide-border">
      {purchases.map((p) => {
        const isOpen = openId === p.id;
        const operatorCents = p.amountCents - p.feeCents;
        const date = p.createdAt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        const time = p.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

        return (
          <div key={p.id}>
            {/* Row principal */}
            <button
              type="button"
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-canvas active:bg-canvas"
              onClick={() => setOpenId(isOpen ? null : p.id)}
            >
              {/* Nom / code */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink">
                  {p.clientName ?? p.code}
                </p>
                <p className="mt-0.5 text-xs text-muted">{date} · {time}</p>
              </div>

              {/* Montant */}
              <span className="shrink-0 text-sm font-semibold text-ink">
                {formatEuros(p.amountCents)}
              </span>

              {/* Chevron */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
              >
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Détail */}
            {isOpen && (
              <div className="border-t border-border bg-canvas px-5 py-4">
                <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  {p.clientEmail && (
                    <Detail label="Email" value={maskEmail(p.clientEmail)} />
                  )}
                  {p.clientPhone && (
                    <Detail label="Téléphone" value={maskPhone(p.clientPhone)} />
                  )}
                  <Detail label="Photos / vidéos" value={`${p.mediaCount} fichier${p.mediaCount > 1 ? "s" : ""}`} />
                  <Detail label={`Part école (${operatorShare}%)`} value={formatEuros(operatorCents)} />
                  <Detail label={`Part Souvenir (${operatorFeePercent}%)`} value={formatEuros(p.feeCents)} />
                  <Detail label="Code galerie" value={p.code} mono />
                </div>
                <Link
                  href={`/g/${p.token}`}
                  target="_blank"
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                >
                  Voir la galerie
                  <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                    <path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Detail({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-medium text-ink ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
