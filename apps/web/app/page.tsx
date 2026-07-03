import Image from "next/image";
import { Nav } from "@/components/marketing/Nav";
import { HeroPostcard } from "@/components/marketing/HeroPostcard";
import { SouvenirMark } from "@/components/SouvenirMark";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};
const BLUE = "#2f5fd0";
const DARK = "#1b2733";
const CREAM = "#f3ede1";

/* Conteneur interne centré 1240px */
const W: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

/* ─────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="lp-body">

      {/* ── HERO ── (inclut le nav pour fond blanc commun) */}
      <div style={{ backgroundColor: "#ffffff", paddingTop: 16 }}>
        <Nav />
        <div style={W}>
          <div className="lp-hero" style={{ paddingTop: 80 }}>
            {/* Text */}
            <div>
              <div
                style={{
                  fontFamily: "var(--font-kalam), 'Kalam', cursive",
                  color: BLUE,
                  fontSize: 14,
                  fontWeight: 400,
                  textTransform: "uppercase",
                  letterSpacing: ".02em",
                  lineHeight: 1,
                  marginBottom: 26,
                }}
              >
                Plateforme souvenirs · Tourisme &amp; outdoor
              </div>
              <h1
                style={{
                  ...D,
                  fontWeight: 800,
                  fontSize: "clamp(40px, 5vw, 62px)",
                  lineHeight: 1.0,
                  letterSpacing: "-.02em",
                  margin: "0 0 24px",
                }}
              >
                Transformez leurs souvenirs en{" "}
                <span style={{ color: BLUE }}>revenus.</span>
              </h1>
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.55,
                  color: "#5d6b78",
                  maxWidth: 460,
                  margin: "0 0 34px",
                }}
              >
                La plateforme clé en main pour vendre les photos et vidéos de
                vos activités. Une galerie privée par client, paiement et
                livraison automatiques. Vous ne gérez rien.
              </p>
              <div className="lp-hero-cta" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <a
                  href="/signup"
                  className="lp-btn-primary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    background: DARK,
                    color: CREAM,
                    padding: "15px 28px",
                    borderRadius: 100,
                    fontWeight: 600,
                    fontSize: 15.5,
                    textDecoration: "none",
                    transition: "opacity .15s",
                  }}
                >
                  Démarrer gratuitement <span>→</span>
                </a>
                <a
                  href="#comment-ca-marche"
                  className="lp-btn-outline"
                  style={{
                    padding: "15px 26px",
                    border: "1.5px solid rgba(27,39,51,.2)",
                    borderRadius: 100,
                    fontWeight: 600,
                    fontSize: 15.5,
                    textDecoration: "none",
                    color: DARK,
                    transition: "background .15s",
                  }}
                >
                  Voir une démo
                </a>
              </div>
            </div>

            {/* Postcard visual */}
            <div className="lp-hero-visual" style={{ position: "relative" }}>
              <HeroPostcard />
            </div>
          </div>
        </div>
      </div>

      {/* ── COMMENT ÇA MARCHE ── */}
      <div id="comment-ca-marche" style={{ backgroundColor: "#ffffff", padding: "66px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ textAlign: "center", marginBottom: 46 }}>
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
                Comment ça marche
              </div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", letterSpacing: "-.02em", margin: 0 }}>
                Trois gestes, aucune gestion
              </h2>
            </div>
            <div className="lp-hiw">
              {[
                { n: "1", title: "Photographiez", desc: "Capturez l'instant pendant l'activité, avec votre matériel habituel." },
                { n: "2", title: "Uploadez", desc: "Déposez vos photos. Une galerie privée est générée pour chaque client." },
                { n: "3", title: "Encaissez", desc: "Le client paie, reçoit ses fichiers, vous êtes crédité. Automatiquement." },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{ background: "#ffffff", borderRadius: 16, padding: "32px 28px", boxShadow: "0 6px 20px rgba(27,39,51,.06)" }}
                >
                  <div
                    style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: BLUE, color: "#fff",
                      ...D, fontWeight: 700, fontSize: 20,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      marginBottom: 20,
                    }}
                  >
                    {s.n}
                  </div>
                  <h3 style={{ ...D, fontWeight: 700, fontSize: 20, margin: "0 0 10px" }}>{s.title}</h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "#5d6b78", margin: 0 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── AVANTAGES (dark, pleine largeur) ── */}
      <div style={{ position: "relative", overflow: "hidden", background: "#141c26", color: CREAM }}>
        <Image src="/hero-paragliding.jpg" fill alt="" style={{ objectFit: "cover", pointerEvents: "none" }} sizes="100vw" />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,rgba(20,28,38,.97) 34%,rgba(20,28,38,.72) 62%,rgba(20,28,38,.5))" }} />
        <div style={{ ...W, position: "relative" }}>
          <div className="lp-section-px" style={{ paddingTop: 64, paddingBottom: 58 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 40, marginBottom: 46, flexWrap: "wrap" }}>
              <div style={{ maxWidth: 560 }}>
                <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 44px)", lineHeight: 1.02, letterSpacing: "-.02em", margin: "0 0 20px", color: CREAM }}>
                  Bien plus qu&apos;une simple vente de photos.
                </h2>
                <p style={{ fontSize: 16, lineHeight: 1.55, color: "#b9c2cc", margin: 0, maxWidth: 500 }}>
                  Chaque galerie travaille pour vous : de nouveaux revenus, une présence en ligne renforcée, des avis clients et une conformité totale — sans effort de votre part.
                </p>
              </div>
              <a href="/signup" style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0, marginTop: 6, textDecoration: "none" }}>
                <span style={{ background: "#fff", color: DARK, padding: "14px 26px", borderRadius: 100, fontWeight: 600, fontSize: 15 }}>
                  Démarrer gratuitement
                </span>
                <span style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", color: DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                  →
                </span>
              </a>
            </div>
            <div className="lp-adv-cards">
              {[
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>,
                  title: "Augmentation du revenu",
                  desc: "Une nouvelle source de chiffre d'affaires sur chaque activité, sans coût fixe.",
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></svg>,
                  title: "Présence & notoriété",
                  desc: "Vos souvenirs partagés en ligne font connaître votre marque bien au-delà.",
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.9 6.6 20l1-6.1L3.2 9.5l6.1-.9z"/></svg>,
                  title: "Collecte des avis",
                  desc: "Sollicitez un avis au moment le plus fort de l'expérience, automatiquement.",
                },
                {
                  icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6z"/><path d="M9 12l2 2 4-4"/></svg>,
                  title: "Conformité RGPD",
                  desc: "Consentement, hébergement européen et gestion des données intégrés.",
                },
              ].map((c) => (
                <div
                  key={c.title}
                  style={{ border: "1px solid rgba(243,237,225,.16)", background: "rgba(243,237,225,.04)", borderRadius: 14, padding: "26px 24px 28px", minHeight: 172, display: "flex", flexDirection: "column", justifyContent: "space-between" }}
                >
                  <span style={{ width: 44, height: 44, borderRadius: 12, background: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {c.icon}
                  </span>
                  <div>
                    <div style={{ ...D, fontWeight: 800, fontSize: 18, color: CREAM, marginBottom: 7 }}>{c.title}</div>
                    <div style={{ fontSize: 13.5, lineHeight: 1.4, color: "#8f9aa6" }}>{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CAS D'USAGE ── */}
      <div id="cas-usage" style={{ padding: "70px 0 96px" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div className="lp-uc-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 38, gap: 20 }}>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(26px, 3vw, 40px)", letterSpacing: "-.02em", lineHeight: 1.05, margin: 0 }}>
                Une carte postale<br />pour chaque aventure
              </h2>
              <p className="lp-uc-subtitle" style={{ fontSize: 15, color: "#5d6b78", maxWidth: 300, margin: "0 0 6px" }}>
                Chaque métier de l&apos;outdoor a des souvenirs à vendre. Souvenir s&apos;adapte au vôtre.
              </p>
            </div>
            <div className="lp-uc-cards">
              {[
                { src: "/uc-surf.jpg",      label: "Écoles de surf" },
                { src: "/uc-ski.jpg",       label: "Moniteurs de ski" },
                { src: "/uc-plongee.jpg",   label: "Centres de plongée" },
                { src: "/uc-nautique.jpg",  label: "Bases nautiques" },
                { src: "/uc-canyoning.jpg", label: "Canyoning" },
                { src: "/uc-aventure.jpg",  label: "Parcs aventure" },
              ].map((uc, i) => (
                <div key={i} style={{ background: "#ffffff", padding: "10px 10px 16px", borderRadius: 10, boxShadow: "0 6px 18px rgba(27,39,51,.07)" }}>
                  <div style={{ position: "relative", width: "100%", height: 190, borderRadius: 5, overflow: "hidden" }}>
                    <Image src={uc.src} fill alt={uc.label} style={{ objectFit: "cover" }} sizes="(max-width:900px) 50vw, 380px" />
                  </div>
                  <div style={{ ...D, fontWeight: 700, fontSize: 16, margin: "12px 4px 0" }}>{uc.label}</div>
                </div>
              ))}
            </div>
            <div className="lp-uc-more" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 44 }}>
              <span className="lp-uc-more-line" style={{ height: 1, flex: 1, maxWidth: 120, background: "rgba(27,39,51,.14)" }} />
              <span style={{ fontSize: 14, color: "#5d6b78" }}>…et plein d&apos;autres activités outdoor</span>
              <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid rgba(27,39,51,.14)", borderRadius: 100, padding: "9px 20px", fontWeight: 600, fontSize: 14, color: DARK, textDecoration: "none" }}>
                Voir tous les métiers <span style={{ color: BLUE }}>→</span>
              </a>
              <span className="lp-uc-more-line" style={{ height: 1, flex: 1, maxWidth: 120, background: "rgba(27,39,51,.14)" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TARIFS (dark, pleine largeur) ── */}
      <div id="tarifs" style={{ backgroundColor: DARK, color: CREAM, padding: "74px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div className="lp-pricing">
              {/* Left */}
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "#8fb0ea", marginBottom: 18 }}>
                  Un modèle limpide
                </div>
                <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-.02em", lineHeight: 1.02, margin: "0 0 20px" }}>
                  Vous ne payez que quand vous gagnez
                </h2>
                <p style={{ fontSize: 16.5, lineHeight: 1.55, color: "#b3c0cd", margin: "0 0 26px", maxWidth: 420 }}>
                  Pas d&apos;abonnement, pas de frais fixes, pas d&apos;installation. Souvenir prend 20% sur chaque vente, vous gardez 80%. Le reste est reversé sur votre compte.
                </p>
                <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: BLUE, color: "#fff", padding: "15px 28px", borderRadius: 100, fontWeight: 600, fontSize: 15.5, textDecoration: "none" }}>
                  Créer mon espace gratuitement <span>→</span>
                </a>
              </div>

              {/* Receipt card */}
              <div className="lp-receipt" style={{ color: DARK }}>
                <div style={{ ...D, fontWeight: 700, fontSize: 15, paddingBottom: 16, borderBottom: "2px dashed rgba(27,39,51,.2)", marginBottom: 16 }}>
                  Reçu · Vente de photos
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 10 }}>
                  <span style={{ color: "#5d6b78" }}>Vente client</span>
                  <span style={{ fontWeight: 600 }}>20,00 €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 16 }}>
                  <span style={{ color: "#5d6b78" }}>Commission Souvenir (20%)</span>
                  <span style={{ fontWeight: 600 }}>– 4,00 €</span>
                </div>
                <div style={{ height: 12, borderRadius: 100, overflow: "hidden", display: "flex", marginBottom: 18 }}>
                  <span style={{ width: "80%", background: BLUE }} />
                  <span style={{ width: "20%", background: "#dfe6ee" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 16, borderTop: "2px dashed rgba(27,39,51,.2)" }}>
                  <span style={{ ...D, fontWeight: 700, fontSize: 17 }}>Vous recevez</span>
                  <span style={{ ...D, fontWeight: 800, fontSize: 38, color: BLUE }}>16,00 €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ padding: "84px 0 40px", textAlign: "center" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: BLUE, marginBottom: 20 }}>
              Commencez aujourd&apos;hui
            </div>
            <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(34px, 4.5vw, 54px)", letterSpacing: "-.02em", lineHeight: 1.02, margin: "0 auto 30px", maxWidth: 680 }}>
              Chaque souvenir mérite d&apos;être <span style={{ color: BLUE }}>envoyé.</span>
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" }}>
              <a href="/signup" style={{ display: "flex", alignItems: "center", gap: 10, background: DARK, color: CREAM, padding: "16px 30px", borderRadius: 100, fontWeight: 600, fontSize: 16, textDecoration: "none" }}>
                Démarrer gratuitement <span>→</span>
              </a>
              <a href="mailto:hello@souvenir.app" style={{ padding: "16px 28px", border: "1.5px solid rgba(27,39,51,.2)", borderRadius: 100, fontWeight: 600, fontSize: 16, textDecoration: "none", color: DARK }}>
                Parler à l&apos;équipe
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER (dark, pleine largeur) ── */}
      <footer style={{ backgroundColor: DARK, color: CREAM, overflow: "hidden" }}>
        <div style={W}>
          <div className="lp-section-px" style={{ paddingTop: 56, paddingBottom: 40, borderBottom: "1px solid rgba(243,237,225,.14)" }}>
            <div className="lp-footer-cols">
              {/* Brand */}
              <div style={{ maxWidth: 320 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <SouvenirMark size="sm" dark />
                  <span style={{ ...D, fontWeight: 700, fontSize: 22, letterSpacing: "-.01em" }}>Souvenir</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 22px", lineHeight: 1.5, color: "#b3c0cd" }}>
                  La plateforme européenne de la monétisation des souvenirs touristiques.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(243,237,225,.06)", border: "1px solid rgba(243,237,225,.16)", borderRadius: 100, padding: "5px 5px 5px 18px", maxWidth: 300 }}>
                  <span style={{ flex: 1, fontSize: 13.5, color: "#8f9aa6" }}>Votre e-mail professionnel</span>
                  <a href="/signup" style={{ background: BLUE, color: "#fff", padding: "9px 18px", borderRadius: 100, fontWeight: 600, fontSize: 13.5, textDecoration: "none" }}>
                    S&apos;inscrire
                  </a>
                </div>
              </div>
              <FooterCol title="Produit" links={[{ href: "#comment-ca-marche", label: "Fonctionnalités" }, { href: "#tarifs", label: "Tarifs" }, { href: "/signup", label: "Galeries" }, { href: "/signup", label: "Nouveautés" }]} />
              <FooterCol title="Métiers" links={[{ href: "#cas-usage", label: "Surf" }, { href: "#cas-usage", label: "Ski" }, { href: "#cas-usage", label: "Plongée" }, { href: "#cas-usage", label: "Parcs aventure" }]} />
              <FooterCol title="Société" links={[{ href: "/", label: "À propos" }, { href: "mailto:hello@souvenir.app", label: "Contact" }, { href: "/", label: "Blog" }, { href: "/mentions-legales", label: "Mentions légales" }]} />
            </div>
          </div>

          <div className="lp-section-px lp-footer-bottom">
            <div style={{ fontSize: 12.5, color: "#7e8c99" }}>© 2026 Souvenir · Transformez les souvenirs en revenus.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 12.5, color: "#8f9aa6" }}>
              <span>Français</span>
              <a href="/confidentialite" style={{ textDecoration: "none", color: "#8f9aa6" }}>Confidentialité</a>
              <a href="/cgu" style={{ textDecoration: "none", color: "#8f9aa6" }}>CGU</a>
              <span style={{ display: "flex", gap: 10 }}>
                {[{ href: "https://linkedin.com", label: "in" }, { href: "https://instagram.com/souvenir.app", label: "ig" }].map((s) => (
                  <a key={s.label} href={s.href} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid rgba(243,237,225,.22)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: CREAM, textDecoration: "none" }}>
                    {s.label}
                  </a>
                ))}
              </span>
            </div>
          </div>

          {/* Giant wordmark */}
          <div style={{ overflow: "hidden" }}>
            <p style={{ ...D, fontWeight: 800, fontSize: "clamp(4rem, 18vw, 250px)", lineHeight: 0.8, letterSpacing: "-.03em", color: "rgba(47,95,208,.28)", margin: "6px 0 -48px", whiteSpace: "nowrap", textAlign: "center" }}>
              Souvenir
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#b3c0cd" }}>
      <b style={{ fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif", color: "#f3ede1", fontWeight: 700, fontSize: 13, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 2, display: "block" }}>
        {title}
      </b>
      {links.map((l) => (
        <a key={l.label} href={l.href} style={{ textDecoration: "none", color: "#b3c0cd" }}>{l.label}</a>
      ))}
    </div>
  );
}
