import { SoonPill } from "@/components/ui/SoonPill";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};

const ITEMS = [
  {
    title: "Accès QR code ou lien",
    desc: "Chaque participant retrouve ses photos, sans compte à créer.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8460C" strokeWidth="1.7">
        <rect x="4" y="4" width="7" height="7" rx="1.4" /><rect x="13" y="4" width="7" height="7" rx="1.4" />
        <rect x="4" y="13" width="7" height="7" rx="1.4" /><path d="M13 13h3v3M20 20v.01M16 20h1" />
      </svg>
    ),
    bg: "#FFF1EB",
  },
  {
    title: "Tableau de bord",
    desc: "Revenus, panier moyen et taux d'achat par sortie, en temps réel.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A8C86" strokeWidth="1.7">
        <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
      </svg>
    ),
    bg: "#E9FBF9",
  },
  {
    title: "Print-on-demand",
    desc: "Bientôt : tirages, posters et albums imprimés en Europe, livrés chez le client.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7">
        <path d="M6 2v20l6-4 6 4V2z" />
      </svg>
    ),
    bg: "#F5EFFF",
    soon: true,
  },
  {
    title: "Merch à votre marque",
    desc: "Bientôt : t-shirts, casquettes et sweats à votre logo, sans stock.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8460C" strokeWidth="1.7">
        <path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
      </svg>
    ),
    bg: "#FFF1EB",
    soon: true,
  },
  {
    title: "Paiements sécurisés",
    desc: "Encaissement direct, reversement automatique, aucune avance.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0A8C86" strokeWidth="1.7">
        <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
    bg: "#E9FBF9",
  },
  {
    title: "Avis & parrainage",
    desc: "Avis Google au bon moment, code de parrainage dans chaque partage.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.7">
        <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z" />
      </svg>
    ),
    bg: "#F5EFFF",
    soon: true,
  },
];

export function Features() {
  return (
    <div className="reveal">
      <div style={{ textAlign: "left", marginBottom: 40, maxWidth: 640 }}>
        <div className="lp-eyebrow" style={{ marginBottom: 14 }}>Côté opérationnel</div>
        <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", letterSpacing: "-.02em", margin: "0 0 16px", color: "#161320" }}>
          Pensé pour ne rien vous demander.
        </h2>
        <p style={{ fontSize: 16, lineHeight: 1.55, color: "#726C80", margin: 0 }}>
          Accès, paiement, tableau de bord, fidélisation : l&apos;essentiel est déjà là, le reste arrive vite.
        </p>
      </div>
      <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {ITEMS.map((item) => (
          <div
            key={item.title}
            style={{
              background: "#ffffff",
              border: "1px solid #EEEBF0",
              borderRadius: 18,
              padding: "26px 24px",
              opacity: item.soon ? 0.75 : 1,
            }}
          >
            <span style={{ width: 44, height: 44, borderRadius: 13, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              {item.icon}
            </span>
            <h4 style={{ ...D, fontWeight: 700, fontSize: 16.5, margin: "0 0 7px", color: "#161320", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              {item.title} {item.soon && <SoonPill />}
            </h4>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: "#726C80", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
