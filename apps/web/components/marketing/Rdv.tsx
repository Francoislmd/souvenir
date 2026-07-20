const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};

export function Rdv() {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL;
  const href = calendlyUrl || "mailto:hello@linktrip.co";

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
        background: "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)",
        boxShadow: "0 20px 50px rgba(255,90,31,.32)",
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
        Je vous montre comment Linktrip s&apos;installe sur vos sorties, et on regarde ensemble si c&apos;est fait pour
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
          color: "#E8460C",
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
