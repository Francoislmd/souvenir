import { PhoneMockup } from "@/components/marketing/PhoneMockup";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};

const TICKS = [
  { b: "QR code ou lien.", t: "Aucune application. Aucun compte à créer." },
  { b: "À votre marque.", t: "Votre logo, vos couleurs. Avis et parrainage inclus." },
  { b: "Il paie, vous encaissez.", t: "Commission reversée automatiquement, à chaque vente." },
];

export function Solution() {
  return (
    <div className="lp-solution-grid reveal" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
      <div>
        <div className="lp-eyebrow" style={{ marginBottom: 14 }}>Le bon moment</div>
        <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-.02em", lineHeight: 1.05, margin: "0 0 18px", color: "#161320" }}>
          Un lien.<br />Envoyé quand l&apos;émotion est là.
        </h2>
        <p style={{ fontSize: 16.5, color: "#726C80", lineHeight: 1.55, margin: "0 0 28px", maxWidth: 460 }}>
          Quelques minutes après la sortie, chaque client reçoit sa galerie. Il revit l&apos;instant, garde ce qu&apos;il
          aime, partage. Vous n&apos;avez rien fait de plus.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {TICKS.map((item) => (
            <div key={item.b} style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
              <span
                style={{
                  width: 24, height: 24, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)",
                  color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <div>
                <b style={{ color: "#161320" }}>{item.b}</b> <span style={{ color: "#726C80", fontSize: 15 }}>{item.t}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <PhoneMockup />
      </div>
    </div>
  );
}
