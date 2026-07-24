"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function DeleteRequestPage() {
  const params = useParams<{ token: string }>();
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmDelete(): Promise<void> {
    setLoading(true);
    await fetch(`/api/g/${params.token}/delete`, { method: "POST" });
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
          <h1 style={{ fontFamily: "'Inter Tight'", fontSize: "1.3rem", fontWeight: 700, marginTop: 20, color: "#161320" }}>Vos photos ont été supprimées</h1>
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#726C80" }}>Ce lien n&rsquo;est plus valide.</p>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: "'Inter Tight'", fontSize: "1.3rem", fontWeight: 700, color: "#161320" }}>Supprimer vos photos ?</h1>
          <p style={{ marginTop: 8, fontSize: "0.9rem", color: "#726C80", lineHeight: 1.5 }}>
            Vos photos personnelles seront supprimées immédiatement et définitivement. Cette action est irréversible.
          </p>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={loading}
            style={{ marginTop: 24, height: 44, width: "100%", borderRadius: 999, border: "1px solid #dc2626", background: "none", fontSize: "0.9rem", fontWeight: 600, color: "#dc2626", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Suppression…" : "Confirmer la suppression"}
          </button>
        </>
      )}
    </main>
  );
}
