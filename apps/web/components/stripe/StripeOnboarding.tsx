"use client";

import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/Spinner";

/*
 * Le formulaire d'inscription Stripe, affiché dans la page.
 *
 * Connect.js est chargé par sa balise script plutôt que par
 * @stripe/connect-js : le paquet n'est qu'un chargeur de ce même script, et
 * l'ajouter imposerait un `pnpm install` pour trois lignes. Les types
 * ci-dessous se limitent à ce que ce fichier appelle.
 */

const CONNECT_JS = "https://connect-js.stripe.com/v1.0/connect.js";

interface ConnectElement extends HTMLElement {
  setOnExit: (cb: () => void) => void;
  setOnLoadError?: (cb: (e: { error: { type: string; message?: string } }) => void) => void;
  setOnLoaderStart?: (cb: () => void) => void;
  setCollectionOptions?: (o: { fields: "currently_due" | "eventually_due"; futureRequirements?: "omit" | "include" }) => void;
}
interface ConnectInstance {
  create: (component: "account-onboarding") => ConnectElement;
}
interface StripeConnectGlobal {
  init?: (options: Record<string, unknown>) => ConnectInstance;
  onLoad?: () => void;
}
declare global {
  interface Window {
    StripeConnect?: StripeConnectGlobal;
  }
}

let loader: Promise<StripeConnectGlobal> | null = null;

function loadConnect(): Promise<StripeConnectGlobal> {
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    if (window.StripeConnect?.init) {
      resolve(window.StripeConnect);
      return;
    }
    window.StripeConnect = window.StripeConnect ?? {};
    window.StripeConnect.onLoad = () => resolve(window.StripeConnect!);
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CONNECT_JS}"]`);
    if (existing) return;
    const s = document.createElement("script");
    s.src = CONNECT_JS;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error("connect.js"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

// Une seule instance par onglet : la documentation Stripe insiste, chaque
// instance refait ses propres appels.
let instance: ConnectInstance | null = null;

async function getInstance(): Promise<ConnectInstance> {
  if (instance) return instance;
  const connect = await loadConnect();
  if (!connect.init) throw new Error("connect.js");
  instance = connect.init({
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    locale: "fr-FR",
    fetchClientSecret: async () => {
      const res = await fetch("/api/stripe/account-session", { method: "POST" });
      if (!res.ok) throw new Error("account-session");
      const { clientSecret } = (await res.json()) as { clientSecret: string };
      return clientSecret;
    },
    // La police et le fond viennent du conteneur ; le reste doit être dit.
    appearance: {
      overlays: "dialog",
      variables: {
        colorPrimary: "#FF5A1F",
        colorText: "#161320",
        colorSecondaryText: "#726C80",
        colorBorder: "#ECE9EF",
        buttonPrimaryColorBackground: "#FF5A1F",
        buttonPrimaryColorText: "#FFFFFF",
        borderRadius: "12px",
        buttonBorderRadius: "12px",
        formBorderRadius: "12px",
        spacingUnit: "10px",
      },
    },
  });
  return instance;
}

/**
 * `onDone(true)` quand Stripe peut encaisser pour ce compte, `onDone(false)`
 * quand le pro a quitté le formulaire avant la fin (ou que Stripe vérifie
 * encore) : à l'appelant de décider s'il laisse passer.
 */
export function StripeOnboarding({ onDone }: { onDone: (ready: boolean) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;
  const [status, setStatus] = useState<"loading" | "shown" | "error" | "checking">("loading");

  useEffect(() => {
    let el: ConnectElement | null = null;
    let cancelled = false;

    void (async () => {
      try {
        const connect = await getInstance();
        if (cancelled || !box.current) return;
        el = connect.create("account-onboarding");
        el.setCollectionOptions?.({ fields: "currently_due", futureRequirements: "omit" });
        el.setOnLoaderStart?.(() => setStatus("shown"));
        el.setOnLoadError?.(() => setStatus("error"));
        el.setOnExit(() => {
          setStatus("checking");
          void (async () => {
            let ready = false;
            try {
              const res = await fetch("/api/stripe/connect/sync", { method: "POST" });
              ready = Boolean(((await res.json()) as { stripeOnboarded?: boolean }).stripeOnboarded);
            } catch {
              ready = false;
            }
            done.current(ready);
          })();
        });
        box.current.appendChild(el);
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      el?.remove();
    };
  }, []);

  return (
    <div>
      {status === "loading" || status === "checking" ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
          <Spinner size={22} label={status === "checking" ? "Vérification auprès de Stripe" : "Chargement de Stripe"} />
        </div>
      ) : null}
      {status === "error" ? (
        <p style={{ margin: "12px 0", fontSize: "0.94rem", color: "#c2410c" }}>
          Stripe ne s&rsquo;est pas affiché. Rechargez la page, ou réessayez dans une minute.
        </p>
      ) : null}
      <div ref={box} hidden={status === "checking"} />
    </div>
  );
}
