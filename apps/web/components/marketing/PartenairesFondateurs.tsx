const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};
const BLUE = "#2f5fd0";

const ITEMS = [
  {
    title: "Accompagnement direct",
    desc: "On installe Souvenir ensemble et on reste joignable. On ajuste ce qui manque, sortie après sortie.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    title: "Conditions fondateur",
    desc: "Commission gelée à votre niveau d'entrée et accès prioritaire aux nouvelles fonctionnalités, avant tout le monde.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1 0-2.8L11.6 3.6A2 2 0 0 1 13 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.4Z" />
        <circle cx="8" cy="8" r="1.3" />
      </svg>
    ),
  },
  {
    title: "Zéro risque",
    desc: "0 € pour démarrer. Vous ne payez qu'une commission sur les ventes réellement réalisées.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
];

export function PartenairesFondateurs() {
  return (
    <div className="reveal">
      <div style={{ maxWidth: 640, marginBottom: 46 }}>
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 600,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: BLUE,
            marginBottom: 14,
          }}
        >
          Programme de lancement
        </div>
        <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", letterSpacing: "-.02em", margin: "0 0 16px" }}>
          Devenez l&apos;une des premières structures.
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5d6b78", margin: 0, maxWidth: 560 }}>
          Souvenir se lance avec un petit groupe de prestataires outdoor. Voilà ce que vous y gagnez en étant parmi
          les premiers.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }} className="lp-fondateurs-grid">
        {ITEMS.map((item) => (
          <div
            key={item.title}
            style={{
              background: "#ffffff",
              border: "1px solid rgba(27,39,51,.08)",
              borderRadius: 16,
              padding: "28px 26px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: "rgba(47,95,208,.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.icon}
            </span>
            <h4 style={{ ...D, fontWeight: 700, fontSize: 17, margin: 0 }}>{item.title}</h4>
            <p style={{ fontSize: 14, lineHeight: 1.5, color: "#5d6b78", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 40 }}>
        <a
          href="#rdv"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 700,
            fontSize: 15,
            color: "#2f5fd0",
            textDecoration: "none",
          }}
        >
          Envie d&apos;en être&nbsp;? Réservez un échange <span>→</span>
        </a>
      </div>
    </div>
  );
}
