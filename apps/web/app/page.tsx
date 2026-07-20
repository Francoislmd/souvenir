import Image from "next/image";
import { Nav } from "@/components/marketing/Nav";
import { HeroPostcard } from "@/components/marketing/HeroPostcard";
import { Probleme } from "@/components/marketing/Probleme";
import { Solution } from "@/components/marketing/Solution";
import { LeviersCarousel } from "@/components/marketing/LeviersCarousel";
import { Demo } from "@/components/marketing/Demo";
import { Features } from "@/components/marketing/Features";
import { RevenueSimulator } from "@/components/marketing/RevenueSimulator";
import { Rdv } from "@/components/marketing/Rdv";
import { PartenairesFondateurs } from "@/components/marketing/PartenairesFondateurs";
import { FaqList } from "@/components/marketing/FaqList";
import { StickyMobileBar } from "@/components/marketing/StickyMobileBar";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const D: React.CSSProperties = {
  fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif",
};
const ORANGE_INK = "#E8460C";
const INK = "#161320";
const SUNSET = "linear-gradient(115deg,#FF3D6E 0%,#FF5A1F 50%,#FFB443 100%)";

/* Conteneur interne centré 1240px */
const W: React.CSSProperties = { maxWidth: 1240, margin: "0 auto" };

const BEN_GRADIENTS = [
  SUNSET,
  "linear-gradient(135deg,#12C7BE,#0FA9C9)",
  "linear-gradient(135deg,#FF3D6E,#8B5CF6)",
  "linear-gradient(135deg,#FFB443,#FF5A1F)",
];

/* ─────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <div className="lp-body">
      <ScrollReveal />

      {/* ── HERO ── */}
      <div style={{ backgroundColor: "#ffffff", paddingTop: 16 }}>
        <Nav />
        <div style={W}>
          <div className="lp-hero" style={{ paddingTop: 80 }}>
            <div>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#413C4E",
                  background: "#ffffff",
                  border: "1px solid #EEEBF0",
                  padding: "6px 8px",
                  borderRadius: 100,
                  boxShadow: "0 1px 2px rgba(22,19,32,.05)",
                  marginBottom: 22,
                }}
              >
                <span style={{ background: SUNSET, color: "#fff", fontWeight: 700, fontSize: 11.5, padding: "3px 10px", borderRadius: 100 }}>
                  Nouveau
                </span>
                Pour les prestataires d&apos;activités outdoor
              </span>
              <h1
                style={{
                  ...D,
                  fontWeight: 700,
                  fontSize: "clamp(2.7rem, 5.6vw, 4.3rem)",
                  lineHeight: 1.0,
                  letterSpacing: "-.02em",
                  margin: "0 0 22px",
                  color: INK,
                }}
              >
                Transformez chaque sortie en{" "}
                <span className="lp-grad-text">revenu et en souvenir.</span>
              </h1>
              <p
                style={{
                  fontSize: 18,
                  lineHeight: 1.55,
                  color: "#726C80",
                  maxWidth: 460,
                  margin: "0 0 32px",
                }}
              >
                Pendant l&apos;activité, vos guides prennent des photos. À la fin, chaque client retrouve les siennes
                par QR code, garde celles qu&apos;il aime et les partage. Vous touchez une commission. Sans matériel,
                sans travail en plus.
              </p>
              <div className="lp-hero-cta" style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <a
                  href="/signup"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: SUNSET, color: "#fff",
                    padding: "15px 28px", borderRadius: 100,
                    fontWeight: 600, fontSize: 15.5, textDecoration: "none",
                    boxShadow: "0 10px 30px rgba(255,90,31,.32)",
                  }}
                >
                  Créer ma boutique <span>→</span>
                </a>
                <a
                  href="#solution"
                  style={{
                    padding: "15px 26px",
                    border: "1.5px solid rgba(22,19,32,.16)",
                    borderRadius: 100,
                    fontWeight: 600, fontSize: 15.5,
                    textDecoration: "none", color: INK,
                  }}
                >
                  Voir le produit
                </a>
              </div>
              <div style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex" }}>
                  {["/hero-jetski.jpg", "/hero-canyoning.jpg", "/hero-rafting.jpg"].map((src, i) => (
                    <span
                      key={src}
                      style={{
                        position: "relative", width: 34, height: 34, borderRadius: "50%",
                        border: "2px solid #FAFAFA", marginLeft: i === 0 ? 0 : -9, overflow: "hidden",
                        boxShadow: "0 1px 2px rgba(22,19,32,.05)",
                      }}
                    >
                      <Image src={src} fill alt="" style={{ objectFit: "cover" }} sizes="34px" />
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 13.5, color: "#726C80" }}>
                  Conçu pour <b style={{ color: INK }}>tous les prestataires outdoor</b>
                </div>
              </div>
            </div>

            <div className="lp-hero-visual" style={{ position: "relative" }}>
              <HeroPostcard />
            </div>
          </div>
        </div>
      </div>

      {/* ── LOGOS ── */}
      <div style={{ padding: "44px 0", borderTop: "1px solid #EEEBF0", borderBottom: "1px solid #EEEBF0", background: "#ffffff" }}>
        <div style={W}>
          <div className="lp-section-px">
            <p style={{ textAlign: "center", fontSize: 12.5, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", color: "#A6A0B2", margin: 0 }}>
              Conçu pour les activités de plein air
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "14px 38px", marginTop: 22 }}>
              {["Randonnée", "Canyoning", "Rafting", "Plongée", "Surf", "Ski", "Parapente", "Via ferrata"].map((a) => (
                <span key={a} style={{ ...D, fontWeight: 700, fontSize: 16, color: "#A6A0B2" }}>{a}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── PROBLÈME ── */}
      <div style={{ background: "#FFF0F5", padding: "70px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <Probleme />
          </div>
        </div>
      </div>

      {/* ── SOLUTION ── */}
      <div id="solution" style={{ background: "#EDFBF7", padding: "76px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <Solution />
          </div>
        </div>
      </div>

      {/* ── BÉNÉFICES ── */}
      <div style={{ backgroundColor: "#ffffff", padding: "76px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ textAlign: "center", marginBottom: 46 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 14 }}>Pour vous</div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3vw, 40px)", letterSpacing: "-.02em", margin: 0, color: INK }}>
                Un revenu de plus. Rien à gérer en plus.
              </h2>
            </div>
            <div className="lp-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                {
                  title: "Un revenu additionnel",
                  desc: "Chaque sortie génère des ventes, sans changer votre métier.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h11M4 14h9M18.5 6A7.5 7.5 0 0 0 6.8 12 7.5 7.5 0 0 0 18.5 18"/></svg>,
                },
                {
                  title: "Aucun travail en plus",
                  desc: "Tri, galerie, paiement, encaissement : tout est automatique.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M20 6 9 17l-5-5"/></svg>,
                },
                {
                  title: "Une meilleure réputation",
                  desc: "Des avis Google au moment où le client est le plus satisfait.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z"/></svg>,
                },
                {
                  title: "Des clients qui reviennent",
                  desc: "Le lien reste ouvert bien après la fin de la sortie.",
                  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15"/></svg>,
                },
              ].map((c, i) => (
                <div key={c.title} style={{ background: "#ffffff", border: "1px solid #EEEBF0", borderRadius: 16, padding: 24, boxShadow: "0 1px 2px rgba(22,19,32,.04)" }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: BEN_GRADIENTS[i], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 15 }}>
                    {c.icon}
                  </span>
                  <h4 style={{ ...D, fontWeight: 700, fontSize: 16.5, margin: "0 0 6px", color: INK }}>{c.title}</h4>
                  <p style={{ fontSize: 14.5, lineHeight: 1.5, color: "#726C80", margin: 0 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ÉTAPES (panneau dégradé) ── */}
      <div id="steps" style={{ padding: "20px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                background: SUNSET,
                color: "#fff",
                borderRadius: 28,
                padding: "64px 56px",
                boxShadow: "0 10px 30px rgba(255,90,31,.32)",
              }}
              className="lp-steps-panel reveal"
            >
              <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.9)", marginBottom: 16 }}>
                En 3 étapes
              </div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 42px)", letterSpacing: "-.02em", lineHeight: 1.05, margin: "0 0 46px", color: "#fff", maxWidth: 560 }}>
                Simple pour vous. Mémorable pour eux.
              </h2>
              <div className="lp-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36 }}>
                {[
                  { n: "01", title: "Vos guides photographient", desc: "Comme d'habitude — aucun geste en plus pendant l'activité." },
                  { n: "02", title: "Le client reçoit son lien", desc: "Photos triées, galerie prête, envoyée sans que vous y pensiez." },
                  { n: "03", title: "Vous êtes payé", desc: "Il choisit ce qu'il garde. Votre commission tombe, automatiquement." },
                ].map((s) => (
                  <div key={s.n} style={{ paddingTop: 24, borderTop: "2px solid rgba(255,255,255,.32)" }}>
                    <div style={{ ...D, fontSize: 16, fontWeight: 700, color: "#fff", opacity: 0.7, letterSpacing: ".06em", marginBottom: 12 }}>{s.n}</div>
                    <h4 style={{ ...D, fontWeight: 700, fontSize: 19, margin: "0 0 8px", color: "#fff" }}>{s.title}</h4>
                    <p style={{ color: "rgba(255,255,255,.85)", fontSize: 15, lineHeight: 1.5, margin: 0 }}>{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEVIERS ── */}
      <div id="revenus" style={{ backgroundColor: "#FFF5EF", padding: "76px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 14 }}>Revenus &amp; fidélisation</div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-.02em", lineHeight: 1.05, margin: "0 auto 18px", maxWidth: 640, color: INK }}>
                Une sortie. <span className="lp-grad-text">Plusieurs façons d&apos;en tirer de la valeur.</span>
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#726C80", margin: "0 auto", maxWidth: 560 }}>
                Photos, avis, parrainage, partages sociaux — et bientôt tirages et produits à votre marque. Un seul
                lien active tout.
              </p>
            </div>
            <LeviersCarousel />
          </div>
        </div>
      </div>

      {/* ── DÉMO ── */}
      <div id="demo" style={{ backgroundColor: "#EDFBF7", padding: "76px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 14 }}>En pratique</div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.4vw, 42px)", letterSpacing: "-.02em", margin: "0 auto 18px", color: INK }}>
                Concrètement, ça donne quoi&nbsp;?
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.55, color: "#726C80", margin: "0 auto", maxWidth: 560 }}>
                L&apos;achat des photos, la demande d&apos;avis Google, et bientôt le cross-sell de vos activités.
              </p>
            </div>
            <Demo />
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div style={{ backgroundColor: "#FFF5EF", padding: "76px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <Features />
          </div>
        </div>
      </div>

      {/* ── CAS D'USAGE ── */}
      <div id="cas-usage" style={{ padding: "70px 0 96px", background: "#ffffff" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div className="lp-uc-head" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 38, gap: 20 }}>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(26px, 3vw, 40px)", letterSpacing: "-.02em", lineHeight: 1.05, margin: 0, color: INK }}>
                Une carte postale<br />pour chaque aventure
              </h2>
              <p className="lp-uc-subtitle" style={{ fontSize: 15, color: "#726C80", maxWidth: 300, margin: "0 0 6px" }}>
                Chaque métier de l&apos;outdoor a des souvenirs à vendre. Linktrip s&apos;adapte au vôtre.
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
                <div key={i} style={{ background: "#ffffff", border: "1px solid #EEEBF0", padding: "10px 10px 16px", borderRadius: 10, boxShadow: "0 6px 18px rgba(22,19,32,.06)" }}>
                  <div style={{ position: "relative", width: "100%", height: 190, borderRadius: 5, overflow: "hidden" }}>
                    <Image src={uc.src} fill alt={uc.label} style={{ objectFit: "cover" }} sizes="(max-width:900px) 50vw, 380px" />
                  </div>
                  <div style={{ ...D, fontWeight: 700, fontSize: 16, margin: "12px 4px 0", color: INK }}>{uc.label}</div>
                </div>
              ))}
            </div>
            <div className="lp-uc-more" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 44 }}>
              <span className="lp-uc-more-line" style={{ height: 1, flex: 1, maxWidth: 120, background: "#EEEBF0" }} />
              <span style={{ fontSize: 14, color: "#726C80" }}>…et plein d&apos;autres activités outdoor</span>
              <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1.5px solid #EEEBF0", borderRadius: 100, padding: "9px 20px", fontWeight: 600, fontSize: 14, color: INK, textDecoration: "none" }}>
                Voir tous les métiers <span style={{ color: ORANGE_INK }}>→</span>
              </a>
              <span className="lp-uc-more-line" style={{ height: 1, flex: 1, maxWidth: 120, background: "#EEEBF0" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── TARIFS ── */}
      <div id="tarifs" style={{ backgroundColor: "#FFF0F5", padding: "74px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div className="lp-pricing">
              <div>
                <div className="lp-eyebrow" style={{ marginBottom: 18 }}>Un modèle limpide</div>
                <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.5vw, 44px)", letterSpacing: "-.02em", lineHeight: 1.02, margin: "0 0 20px", color: INK }}>
                  Vous ne payez que quand vous gagnez
                </h2>
                <p style={{ fontSize: 16.5, lineHeight: 1.55, color: "#726C80", margin: "0 0 26px", maxWidth: 420 }}>
                  Pas d&apos;abonnement, pas de frais fixes, pas d&apos;installation. Linktrip prend 20% sur chaque
                  vente, vous gardez 80%. Le reste est reversé sur votre compte.
                </p>
                <a href="/signup" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: SUNSET, color: "#fff", padding: "15px 28px", borderRadius: 100, fontWeight: 600, fontSize: 15.5, textDecoration: "none", boxShadow: "0 10px 30px rgba(255,90,31,.28)" }}>
                  Créer mon espace gratuitement <span>→</span>
                </a>
              </div>

              <div className="lp-receipt" style={{ background: "#ffffff", color: INK, borderRadius: 18, boxShadow: "0 6px 20px rgba(22,19,32,.06)" }}>
                <div style={{ ...D, fontWeight: 700, fontSize: 15, paddingBottom: 16, borderBottom: "2px dashed #EEEBF0", marginBottom: 16 }}>
                  Reçu · Vente de photos
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 10 }}>
                  <span style={{ color: "#726C80" }}>Vente client</span>
                  <span style={{ fontWeight: 600 }}>20,00 €</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, marginBottom: 16 }}>
                  <span style={{ color: "#726C80" }}>Commission Linktrip (20%)</span>
                  <span style={{ fontWeight: 600 }}>– 4,00 €</span>
                </div>
                <div style={{ height: 12, borderRadius: 100, overflow: "hidden", display: "flex", marginBottom: 18 }}>
                  <span style={{ width: "80%", background: SUNSET }} />
                  <span style={{ width: "20%", background: "#EEEBF0" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", paddingTop: 16, borderTop: "2px dashed #EEEBF0" }}>
                  <span style={{ ...D, fontWeight: 700, fontSize: 17 }}>Vous recevez</span>
                  <span className="lp-grad-text" style={{ ...D, fontWeight: 800, fontSize: 38 }}>16,00 €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SIMULATEUR DE REVENUS ── */}
      <div style={{ backgroundColor: "#ffffff", padding: "76px 0" }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div className="lp-section-px reveal" style={{ textAlign: "center" }}>
            <RevenueSimulator />
          </div>
        </div>
      </div>

      {/* ── RDV ── */}
      <div id="rdv" style={{ padding: "20px 0 76px", background: "#ffffff" }}>
        <div style={W}>
          <div className="lp-section-px">
            <Rdv />
          </div>
        </div>
      </div>

      {/* ── PARTENAIRES FONDATEURS ── */}
      <div id="fondateurs" style={{ backgroundColor: "#ffffff", padding: "20px 0 90px" }}>
        <div style={W}>
          <div className="lp-section-px">
            <PartenairesFondateurs />
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{ background: "#FFF0F5", padding: "80px 0" }}>
        <div style={W}>
          <div className="lp-section-px">
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div className="lp-eyebrow" style={{ marginBottom: 14 }}>Questions fréquentes</div>
              <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(28px, 3.2vw, 40px)", letterSpacing: "-.02em", margin: 0, color: INK }}>
                Ce qu&apos;il faut savoir avant de commencer.
              </h2>
            </div>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <FaqList />
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA FINAL ── */}
      <div style={{ padding: "84px 24px 96px" }}>
        <div style={W}>
          <div
            className="reveal"
            style={{
              position: "relative", overflow: "hidden", borderRadius: 28,
              background: SUNSET, color: "#fff", textAlign: "center",
              padding: "84px 24px", boxShadow: "0 10px 30px rgba(255,90,31,.32)",
            }}
          >
            <h2 style={{ ...D, fontWeight: 800, fontSize: "clamp(2rem, 4.4vw, 3rem)", letterSpacing: "-.02em", lineHeight: 1.05, margin: "0 auto 16px", maxWidth: "18ch", color: "#fff" }}>
              Faites de la prochaine sortie un revenu.
            </h2>
            <p style={{ color: "rgba(255,255,255,.9)", maxWidth: 440, margin: "0 auto 30px" }}>
              Réglez votre marque et vos tarifs, publiez votre première galerie. On vous accompagne pour démarrer.
            </p>
            <a
              href="/signup"
              style={{
                display: "inline-flex", alignItems: "center", gap: 9,
                background: "#fff", color: ORANGE_INK, fontWeight: 700, fontSize: 16,
                padding: "16px 30px", borderRadius: 100, textDecoration: "none",
                boxShadow: "0 12px 28px rgba(22,19,32,.2)",
              }}
            >
              Créer ma boutique <span>→</span>
            </a>
            <div style={{ marginTop: 18, fontSize: 13, color: "rgba(255,255,255,.75)" }}>
              Gratuit pour démarrer · Sans engagement
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{ backgroundColor: "#ffffff", borderTop: "1px solid #EEEBF0", overflow: "hidden" }}>
        <div style={W}>
          <div className="lp-section-px" style={{ paddingTop: 56, paddingBottom: 40 }}>
            <div className="lp-footer-cols">
              <div style={{ maxWidth: 320 }}>
                <div style={{ marginBottom: 14 }}>
                  <span style={{ ...D, fontWeight: 800, fontSize: 22, letterSpacing: "-.02em", color: INK }}>Linktrip</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 500, margin: 0, lineHeight: 1.5, color: "#726C80" }}>
                  Linktrip transforme chaque sortie en revenu et en souvenir, pour tous les prestataires d&apos;activités
                  outdoor.
                </p>
              </div>
              <FooterCol title="Produit" links={[{ href: "#solution", label: "Aperçu" }, { href: "#steps", label: "Fonctionnement" }, { href: "#revenus", label: "Revenus" }, { href: "/signup", label: "Créer ma boutique" }]} />
              <FooterCol title="Ressources" links={[{ href: "#faq", label: "FAQ" }, { href: "#tarifs", label: "Tarifs" }, { href: "#rdv", label: "Contact" }]} />
              <FooterCol title="Légal" links={[{ href: "/confidentialite", label: "Confidentialité" }, { href: "/cgu", label: "Conditions" }, { href: "/confidentialite", label: "RGPD" }]} />
            </div>
          </div>

          <div className="lp-section-px lp-footer-bottom" style={{ borderTop: "1px solid #EEEBF0", paddingTop: 22, paddingBottom: 22 }}>
            <span style={{ fontSize: 13.5, color: "#A6A0B2" }}>© 2026 Linktrip · Entre Paris et Annecy</span>
            <div style={{ display: "flex", gap: 16 }}>
              <a href="https://instagram.com/linktrip" style={{ textDecoration: "none", color: "#726C80", fontSize: 13.5 }}>Instagram</a>
              <a href="https://linkedin.com" style={{ textDecoration: "none", color: "#726C80", fontSize: 13.5 }}>LinkedIn</a>
              <a href="mailto:hello@linktrip.co" style={{ textDecoration: "none", color: "#726C80", fontSize: 13.5 }}>hello@linktrip.co</a>
            </div>
          </div>
        </div>
      </footer>

      <StickyMobileBar />
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 14 }}>
      <b style={{ fontFamily: "var(--font-bricolage), 'Bricolage Grotesque', sans-serif", color: "#161320", fontWeight: 600, fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 4, display: "block" }}>
        {title}
      </b>
      {links.map((l) => (
        <a key={l.label} href={l.href} style={{ textDecoration: "none", color: "#726C80" }}>{l.label}</a>
      ))}
    </div>
  );
}
