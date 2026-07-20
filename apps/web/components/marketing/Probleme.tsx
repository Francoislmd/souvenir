const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};
const BLUE = "#2f5fd0";

const ITEMS = [
  {
    title: "Des souvenirs déjà capturés",
    desc: "Vos moniteurs photographient déjà chaque session. La matière est là, prête à être valorisée.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Un lien à garder ouvert",
    desc: "Juste après l'activité, l'émotion est vive. C'est le moment idéal pour rester en contact avec vos clients.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
        <path d="M4 6h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
  },
  {
    title: "Un revenu à portée",
    desc: "Vos clients repartiraient volontiers avec leurs photos. Il suffit de pouvoir leur proposer, sans travail en plus.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
];

export function Probleme() {
  return (
    <div style={{ textAlign: "center" }} className="reveal">
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
        L&apos;instant clé
      </div>
      <h2
        style={{
          ...D,
          fontWeight: 800,
          fontSize: "clamp(28px, 3vw, 40px)",
          letterSpacing: "-.02em",
          lineHeight: 1.08,
          margin: "0 auto 20px",
          maxWidth: 640,
        }}
      >
        L&apos;émotion est à son maximum. C&apos;est là que tout se joue.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: "#5d6b78", margin: "0 auto 46px", maxWidth: 560 }}>
        La fin d&apos;une sortie, c&apos;est le pic. Vos clients ont envie de partager, de revenir, de garder une trace.
        Il ne manque qu&apos;une façon simple de leur proposer.
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 18,
          textAlign: "left",
        }}
        className="lp-prob-grid"
      >
        {ITEMS.map((item) => (
          <div
            key={item.title}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "28px 26px",
              boxShadow: "0 6px 20px rgba(27,39,51,.06)",
            }}
          >
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              {item.icon}
            </span>
            <h3 style={{ ...D, fontWeight: 700, fontSize: 18, margin: "0 0 8px" }}>{item.title}</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "#5d6b78", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
