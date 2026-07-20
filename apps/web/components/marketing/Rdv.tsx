const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};

export function Rdv() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const href = calendlyUrl || "mailto:hello@souvenir.app";

  return (
    <div
      className="reveal"
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 28,
        padding: "64px 40px",
        textAlign: "center",
        color: "#fff",
        background: "linear-gradient(135deg, #7dd3fc 0%, #3b82f6 55%, #4f46e5 100%)",
        boxShadow: "0 20px 50px rgba(79,70,229,.28)",
      }}
    >
      <div
        style={{
          fontSize: 12.5,
          fontWeight: 600,
          letterSpacing: ".14em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,.85)",
          marginBottom: 16,
        }}
      >
        Discutons-en
      </div>
      <h2
        style={{
          ...D,
          fontWeight: 800,
          fontSize: "clamp(28px, 3.6vw, 44px)",
          letterSpacing: "-.02em",
          lineHeight: 1.05,
          margin: "0 auto 18px",
          maxWidth: 500,
          color: "#fff",
        }}
      >
        Envie d&apos;en parler&nbsp;? Prenons 20 minutes.
      </h2>
      <p style={{ fontSize: 16, lineHeight: 1.55, color: "rgba(255,255,255,.9)", margin: "0 auto 32px", maxWidth: 460 }}>
        Je vous montre comment Souvenir s&apos;installe sur vos sorties, et on regarde ensemble si c&apos;est fait pour
        vous. Sans engagement.
      </p>
      <a
        href={href}
        target={calendlyUrl ? "_blank" : undefined}
        rel={calendlyUrl ? "noopener" : undefined}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          background: "#fff",
          color: "#3b3ab0",
          padding: "15px 28px",
          borderRadius: 100,
          fontWeight: 700,
          fontSize: 15.5,
          textDecoration: "none",
          boxShadow: "0 12px 28px rgba(22,19,32,.2)",
        }}
      >
        Réserver un créneau <span>→</span>
      </a>
    </div>
  );
}
