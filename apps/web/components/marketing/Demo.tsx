import Image from "next/image";
import { SoonPill } from "@/components/ui/SoonPill";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};

const GALLERY = ["/uc-surf.jpg", "/uc-ski.jpg", "/uc-canyoning.jpg", "/uc-plongee.jpg"];

export function Demo() {
  return (
    <div className="lp-demo-grid reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
      {/* Achat des photos */}
      <div style={{ background: "#ffffff", border: "1px solid #EEEBF0", borderRadius: 18, padding: 18, boxShadow: "0 6px 20px rgba(22,19,32,.05)" }}>
        <div style={{ background: "#F4F1F7", borderRadius: 12, padding: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {GALLERY.map((src, i) => (
              <div key={src} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden" }}>
                <Image src={src} fill alt="" style={{ objectFit: "cover" }} sizes="140px" />
                {i === 0 && (
                  <span
                    style={{
                      position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: "50%",
                      background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)",
                      display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", borderRadius: 10, padding: "9px 11px" }}>
            <div>
              <div style={{ fontSize: 10.5, color: "#A6A0B2" }}>Pack HD · 24 photos</div>
              <div style={{ ...D, fontWeight: 700, fontSize: 16, color: "#161320" }}>20 €</div>
            </div>
            <span style={{ background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)", color: "#fff", borderRadius: 100, fontWeight: 700, fontSize: 12.5, padding: "8px 14px" }}>
              Acheter
            </span>
          </div>
        </div>
        <h4 style={{ ...D, fontWeight: 700, fontSize: 16.5, margin: "16px 0 6px", color: "#161320" }}>Achat des photos</h4>
        <p style={{ fontSize: 13.5, color: "#726C80", margin: 0, lineHeight: 1.5 }}>
          Le client sélectionne, paie en deux clics, reçoit ses photos en HD.
        </p>
      </div>

      {/* Demande d'avis Google */}
      <div style={{ background: "#ffffff", border: "1px solid #EEEBF0", borderRadius: 18, padding: 18, boxShadow: "0 6px 20px rgba(22,19,32,.05)" }}>
        <div style={{ background: "#F4F1F7", borderRadius: 12, padding: "28px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ ...D, fontWeight: 700, fontSize: 15, color: "#161320" }}>Vous avez aimé votre sortie&nbsp;?</div>
          <div style={{ color: "#FFB443", fontSize: 22, letterSpacing: 4 }}>★★★★★</div>
          <span style={{ background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)", color: "#fff", borderRadius: 100, fontWeight: 700, fontSize: 12.5, padding: "9px 16px" }}>
            Laisser un avis Google
          </span>
        </div>
        <h4 style={{ ...D, fontWeight: 700, fontSize: 16.5, margin: "16px 0 6px", color: "#161320" }}>Demande d&apos;avis</h4>
        <p style={{ fontSize: 13.5, color: "#726C80", margin: 0, lineHeight: 1.5 }}>
          Au moment où le client est ravi, on l&apos;invite à noter votre structure sur Google.
        </p>
      </div>

      {/* Cross-sell — Bientôt */}
      <div style={{ background: "#ffffff", border: "1px solid #EEEBF0", borderRadius: 18, padding: 18, boxShadow: "0 6px 20px rgba(22,19,32,.05)" }}>
        <div style={{ position: "relative", background: "#F4F1F7", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 8, opacity: 0.5, filter: "saturate(.6)" }}>
          {["Jet-ski", "Rafting", "Surf"].map((name) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", borderRadius: 10, padding: "9px 10px" }}>
              <span style={{ width: 30, height: 30, borderRadius: 8, background: "#EEEBF0", flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#161320" }}>{name}</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#726C80" }}>-10%</span>
            </div>
          ))}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <SoonPill />
          </div>
        </div>
        <h4 style={{ ...D, fontWeight: 700, fontSize: 16.5, margin: "16px 0 6px", color: "#161320" }}>
          Cross-sell d&apos;activité
        </h4>
        <p style={{ fontSize: 13.5, color: "#726C80", margin: 0, lineHeight: 1.5 }}>
          Bientôt : proposez vos autres prestations au meilleur moment.
        </p>
      </div>
    </div>
  );
}
