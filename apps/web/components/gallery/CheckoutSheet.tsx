"use client";

import { useEffect } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";

export function CheckoutSheet({
  clientSecret,
  priceLabel,
  onClose,
}: {
  clientSecret: string;
  priceLabel: string;
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  if (!stripePromise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-[28px] bg-surface shadow-2xl sm:rounded-card sm:my-6 animate-[checkout-sheet-in_0.25s_ease-out]">
        <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-border sm:hidden" />

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink">Débloquer mes souvenirs</p>
            <p className="text-xs text-ink-2">Paiement sécurisé · {priceLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink-2 transition hover:bg-border active:scale-95"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-[420px] flex-1 overflow-y-auto">
          <EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret: async () => clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
