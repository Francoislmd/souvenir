import Link from "next/link";

const D = { fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif" };

export function Nav() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 50px",
      }}
      className="flex-wrap gap-y-3 px-4 sm:px-8 lg:px-[50px]"
    >
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "#1b2733" }}
      >
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: "2px solid #1b2733",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            ...D,
            flexShrink: 0,
          }}
        >
          S
        </span>
        <span style={{ ...D, fontWeight: 700, fontSize: 23, letterSpacing: "-.01em" }}>Souvenir</span>
      </Link>

      <div
        style={{ display: "flex", alignItems: "center", gap: 30, fontSize: 14, fontWeight: 500 }}
        className="flex-wrap gap-y-2 hidden sm:flex"
      >
        <a href="#comment-ca-marche" style={{ textDecoration: "none", color: "#1b2733" }}>
          Fonctionnalités
        </a>
        <a href="#cas-usage" style={{ textDecoration: "none", color: "#1b2733" }}>
          Cas d&apos;usage
        </a>
        <a href="#tarifs" style={{ textDecoration: "none", color: "#1b2733" }}>
          Tarifs
        </a>
        <a href="/login" style={{ textDecoration: "none", color: "#1b2733", opacity: 0.6 }}>
          Se connecter
        </a>
        <a
          href="/signup"
          style={{
            background: "#2f5fd0",
            color: "#fff",
            padding: "11px 22px",
            borderRadius: 100,
            fontWeight: 600,
            textDecoration: "none",
            fontSize: 14,
          }}
        >
          Démarrer gratuitement
        </a>
      </div>

      {/* Mobile CTA */}
      <a
        href="/signup"
        className="sm:hidden"
        style={{
          background: "#2f5fd0",
          color: "#fff",
          padding: "9px 18px",
          borderRadius: 100,
          fontWeight: 600,
          textDecoration: "none",
          fontSize: 13,
        }}
      >
        Démarrer gratuitement
      </a>
    </div>
  );
}
