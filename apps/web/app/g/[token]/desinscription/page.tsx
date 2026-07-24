"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function UnsubscribePage() {
  const params = useParams<{ token: string }>();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmUnsubscribe(): Promise<void> {
    setLoading(true);
    await fetch(`/api/g/${params.token}/unsubscribe`, { method: "POST" });
    setDone(true);
    setLoading(false);
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", textAlign: "center", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {done ? (
        <>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EAF7EF", display: "grid", placeItems: "center" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Inter Tight'", fontSize: "1.3rem", fontWeight: 700, marginTop: 20, color: "#161320" }}>Vous ne recevrez plus ces messages</h1>
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#726C80" }}>
            Vous continuerez de recevoir l&rsquo;email de vos photos et votre reçu d&rsquo;achat, qui ne sont pas concernés.
          </p>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: "'Inter Tight'", fontSize: "1.3rem", fontWeight: 700, color: "#161320" }}>Ne plus recevoir ces emails ?</h1>
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#726C80", lineHeight: 1.5 }}>
            Vous ne recevrez plus de relances ni d&rsquo;offres. L&rsquo;email de livraison de vos photos et votre reçu d&rsquo;achat continueront de vous être envoyés.
          </p>
          <button
            type="button"
            onClick={confirmUnsubscribe}
            disabled={loading}
            style={{ marginTop: 24, height: 44, width: "100%", borderRadius: 999, border: "1px solid #161320", background: "none", fontSize: "0.9rem", fontWeight: 600, color: "#161320", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "…" : "Confirmer"}
          </button>
        </>
      )}
    </main>
  );
}
