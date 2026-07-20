import Image from "next/image";
import styles from "./linktrip.module.css";
import { LinktripNav } from "@/components/marketing/LinktripNav";
import { LinktripLeviers } from "@/components/marketing/LinktripLeviers";
import { LinktripReveal } from "@/components/marketing/LinktripReveal";
import { LinktripMobileBar } from "@/components/marketing/LinktripMobileBar";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export default function Home() {
  return (
    <div className={styles.page}>
      <LinktripReveal />

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="skA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFE0B0" /><stop offset=".55" stopColor="#FFB06A" /><stop offset="1" stopColor="#FF8A5B" /></linearGradient>
          <linearGradient id="seaA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2E7FA6" /><stop offset="1" stopColor="#1A5877" /></linearGradient>
          <symbol id="sc-para" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect width="100" height="100" fill="url(#skA)" /><circle cx="74" cy="26" r="15" fill="#FFF4DD" opacity=".85" /><rect y="64" width="100" height="36" fill="url(#seaA)" /><path d="M0 66 Q25 62 50 66 T100 66 V72 H0 Z" fill="#3E93B8" opacity=".6" /><path d="M30 30 Q50 14 70 30 Q66 33 50 33 Q34 33 30 30 Z" fill="#FF5A1F" /><path d="M31 30 L47 52 M69 30 L53 52 M50 33 L50 52" stroke="#23384a" strokeWidth="1" fill="none" /><circle cx="50" cy="55" r="2.6" fill="#23384a" />
          </symbol>
          <linearGradient id="skB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DCEFFB" /><stop offset="1" stopColor="#A6D4F0" /></linearGradient>
          <linearGradient id="seaB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2288C4" /><stop offset="1" stopColor="#12578A" /></linearGradient>
          <symbol id="sc-jet" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect width="100" height="100" fill="url(#skB)" /><rect y="54" width="100" height="46" fill="url(#seaB)" /><ellipse cx="46" cy="66" rx="20" ry="5" fill="#0F4E7C" opacity=".5" /><path d="M34 64 Q40 60 54 61 L60 64 Q58 68 48 68 Q38 68 34 64 Z" fill="#FF5A1F" /><path d="M60 63 Q72 58 82 63 M62 67 Q74 64 84 68" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".9" />
          </symbol>
          <linearGradient id="skC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#EAF7F4" /><stop offset="1" stopColor="#C4EAE3" /></linearGradient>
          <linearGradient id="seaC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#37B3A6" /><stop offset="1" stopColor="#1C8378" /></linearGradient>
          <symbol id="sc-sup" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect width="100" height="100" fill="url(#skC)" /><path d="M0 60 L100 44 V100 H0 Z" fill="url(#seaC)" /><ellipse cx="52" cy="72" rx="22" ry="4" fill="#0F5F57" opacity=".4" /><rect x="40" y="70" width="26" height="3.4" rx="1.7" fill="#F3E7CE" /><path d="M51 52 L51 70" stroke="#23384a" strokeWidth="2" strokeLinecap="round" /><circle cx="51" cy="49" r="3" fill="#23384a" />
          </symbol>
        </defs>
      </svg>

      <LinktripNav />

      {/* ── HERO ── */}
      <section id="top" className={styles.hero}>
        <div className={cx(styles.blob, styles.b1)} />
        <div className={cx(styles.blob, styles.b2)} />
        <div className={cx(styles.blob, styles.b3)} />
        <div className={cx(styles.container, styles.heroGrid)}>
          <div>
            <span className={cx(styles.badge, "rv")}>
              <span className={styles.tag}>Nouveau</span>
              Pour les prestataires d&apos;activités outdoor
            </span>
            <h1 className={cx(styles.h1, "rv", "d1")}>
              Transformez chaque sortie en{" "}
              <span className={styles.gradText}>revenu et en souvenir.</span>
            </h1>
            <p className={cx(styles.heroLead, "rv", "d2")}>
              Pendant l&apos;activité, vos guides prennent des photos. À la fin, chaque client retrouve les siennes
              par QR code, garde celles qu&apos;il aime et les partage. Vous touchez une commission. Sans matériel,
              sans travail en plus.
            </p>
            <div className={cx(styles.heroCta, "rv", "d3")}>
              <a className={cx(styles.btn, styles.btnPrimary, styles.btnLg)} href="/signup">
                Créer ma boutique <span className={styles.arrow}>→</span>
              </a>
              <a className={cx(styles.btn, styles.btnGhost, styles.btnLg)} href="#solution">
                Voir le produit
              </a>
            </div>
            <div className={cx(styles.proof, "rv", "d3")}>
              <div className={styles.avatars}>
                {["sc-para", "sc-jet", "sc-sup"].map((id) => (
                  <span key={id} className={styles.av}>
                    <svg width="100%" height="100%" viewBox="0 0 100 100"><use href={`#${id}`} /></svg>
                  </span>
                ))}
              </div>
              <div className={styles.txt}>Conçu pour <b>tous les prestataires outdoor</b></div>
            </div>
          </div>

          <div className={cx(styles.mock, "rv", "d2")}>
            <div className={styles.lockcard}>
              <div className={styles.lcPhoto}>
                <div className={styles.lcBlur}>
                  <Image src="/hero-parasail.webp" width={600} height={750} alt="Votre photo de sortie" priority />
                </div>
                <span className={styles.lcWm}>Aperçu · votre photo</span>
                <div className={styles.lcLock}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2.2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
                    <circle cx="12" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
                  </svg>
                </div>
              </div>
              <div className={styles.lcBar}>
                <div>
                  <div className={styles.lcT}>Pack HD · 24 photos</div>
                  <div className={styles.lcS}>Débloquez vos souvenirs</div>
                </div>
                <button type="button" className={styles.lcPay}>Paiement 20 €</button>
              </div>
            </div>
            <div className={styles.miniGraph}>
              <div className={styles.mgTop}><span>Revenus</span><span className={styles.mgUp}>+38%</span></div>
              <div className={styles.mgBars}>
                {[34, 50, 42, 66, 56, 80, 98].map((h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS ── */}
      <div className={styles.logos}>
        <div className={styles.container}>
          <p className="rv">Conçu pour les activités de plein air</p>
          <div className={cx(styles.logoRow, "rv", "d1")}>
            {["Randonnée", "Canyoning", "Rafting", "Plongée", "Surf", "Ski", "Parapente", "Via ferrata"].map((a) => (
              <span key={a} className={styles.lg}>{a}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLÈME ── */}
      <section className={cx(styles.section, styles.bgRose)}>
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, "rv")}>
            <span className={styles.eyebrow}>L&apos;instant clé</span>
            <h2 style={{ marginTop: 12 }}>L&apos;émotion est à son maximum. C&apos;est là que tout se joue.</h2>
            <p>
              La fin d&apos;une sortie, c&apos;est le pic. Vos clients ont envie de partager, de revenir, de garder
              une trace. Il ne manque qu&apos;une façon simple de leur proposer.
            </p>
          </div>
          <div className={styles.probGrid}>
            <div className={cx(styles.prob, "rv")}>
              <div className={styles.ic}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="12" cy="12" r="3" /></svg>
              </div>
              <h4>Des souvenirs déjà capturés</h4>
              <p>Vos guides photographient déjà chaque groupe. La matière est là, prête à être valorisée.</p>
            </div>
            <div className={cx(styles.prob, "rv", "d1")}>
              <div className={styles.ic}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16v12H4z" /><path d="M4 7l8 6 8-6" /></svg>
              </div>
              <h4>Un lien à garder ouvert</h4>
              <p>Juste après la sortie, l&apos;émotion est vive. C&apos;est le moment idéal pour rester en contact.</p>
            </div>
            <div className={cx(styles.prob, "rv", "d2")}>
              <div className={styles.ic}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M23 21v-2a4 4 0 0 0-3-3.87" /></svg>
              </div>
              <h4>Un revenu à portée</h4>
              <p>Vos clients repartiraient volontiers avec leurs photos. Il suffit de pouvoir leur proposer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section id="solution" className={cx(styles.section, styles.bgMint)}>
        <div className={cx(styles.container, styles.split)}>
          <div className="rv">
            <span className={styles.eyebrow}>Le bon moment</span>
            <h2 style={{ marginTop: 12 }}>Un lien.<br />Envoyé quand l&apos;émotion est là.</h2>
            <p className={styles.muted} style={{ marginTop: 16, fontSize: "1.06rem" }}>
              Quelques minutes après la sortie, chaque client reçoit sa galerie. Il revit l&apos;instant, garde ce
              qu&apos;il aime, partage. Vous n&apos;avez rien fait de plus.
            </p>
            <div className={styles.featureList}>
              <div className={styles.fl}>
                <span className={styles.chk}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>QR code ou lien.</b> <span>Aucune application. Aucun compte à créer.</span></div>
              </div>
              <div className={styles.fl}>
                <span className={styles.chk}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>À votre marque.</b> <span>Votre logo, vos couleurs. Avis et parrainage inclus.</span></div>
              </div>
              <div className={styles.fl}>
                <span className={styles.chk}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></span>
                <div><b>Il paie, vous encaissez.</b> <span>Commission reversée automatiquement, à chaque vente.</span></div>
              </div>
            </div>
          </div>
          <div className={cx("rv", "d1")}>
            <div className={styles.solVisual}>
              <Image src="/solution-canyoning.webp" width={540} height={720} alt="Cliente après sa sortie canyoning" className={styles.solPhoto} />
              <div className={styles.solMail}>
                <div className={styles.solMailTop}>
                  <span className={styles.solMailAv}>N</span>
                  <div>
                    <div className={styles.solMailNm}>Nautic Center</div>
                    <div className={styles.solMailSub}>Message reçu · à l&apos;instant</div>
                  </div>
                  <span className={styles.solMailIc}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
                  </span>
                </div>
                <div className={styles.solMailTxt}>Merci Kevin&#8202;! Vos <b>24 photos</b> de canyoning sont prêtes.</div>
                <a className={styles.solMailCta} href="/signup">
                  Voir et acheter mes photos <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BÉNÉFICES ── */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, "rv")}>
            <span className={styles.eyebrow}>Pour vous</span>
            <h2 style={{ marginTop: 12 }}>Un revenu de plus. Rien à gérer en plus.</h2>
          </div>
          <div className={styles.benGrid}>
            <div className={cx(styles.ben, "rv")}>
              <div className={styles.ic}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h11M4 14h9M18.5 6A7.5 7.5 0 0 0 6.8 12 7.5 7.5 0 0 0 18.5 18" /></svg></div>
              <h4>Un revenu additionnel</h4>
              <p>Chaque sortie génère des ventes, sans changer votre métier.</p>
            </div>
            <div className={cx(styles.ben, "rv", "d1")}>
              <div className={styles.ic}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M20 6 9 17l-5-5" /></svg></div>
              <h4>Aucun travail en plus</h4>
              <p>Tri, galerie, paiement, encaissement : tout est automatique.</p>
            </div>
            <div className={cx(styles.ben, "rv", "d2")}>
              <div className={styles.ic}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z" /></svg></div>
              <h4>Une meilleure réputation</h4>
              <p>Des avis Google au moment où le client est le plus satisfait.</p>
            </div>
            <div className={cx(styles.ben, "rv", "d3")}>
              <div className={styles.ic}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15" /></svg></div>
              <h4>Des clients qui reviennent</h4>
              <p>Le lien reste ouvert bien après la fin de la sortie.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── ÉTAPES ── */}
      <section className={styles.section} id="steps" style={{ paddingTop: 20 }}>
        <div className={styles.container}>
          <div className={cx(styles.steps, "rv")}>
            <span className={styles.eyebrow}>En 3 étapes</span>
            <h2 style={{ marginTop: 12 }}>Simple pour vous. Mémorable pour eux.</h2>
            <p>De la sortie au paiement, rien ne change dans vos habitudes.</p>
            <div className={styles.stepsGrid}>
              <div className={styles.stepC}>
                <div className={styles.scNum}>01</div>
                <h4>Vos guides photographient</h4>
                <p>Comme d&apos;habitude — aucun geste en plus pendant l&apos;activité.</p>
              </div>
              <div className={styles.stepC}>
                <div className={styles.scNum}>02</div>
                <h4>Le client reçoit son lien</h4>
                <p>Photos triées, galerie prête, envoyée sans que vous y pensiez.</p>
              </div>
              <div className={styles.stepC}>
                <div className={styles.scNum}>03</div>
                <h4>Vous êtes payé</h4>
                <p>Il choisit ce qu&apos;il garde. Votre commission tombe, automatiquement.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LEVIERS ── */}
      <section id="revenus" className={cx(styles.section, styles.bgPeach)} style={{ paddingTop: 20 }}>
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, styles.sectionHeadCenter, "rv")}>
            <span className={styles.eyebrow}>Revenus &amp; fidélisation</span>
            <h2 style={{ marginTop: 12 }}>
              Une sortie. <span className={styles.gradText}>Plusieurs façons d&apos;en tirer de la valeur.</span>
            </h2>
            <p>
              Photos, avis, parrainage, partages — et bientôt tirages et produits à votre marque. Un seul lien
              active tout.
            </p>
          </div>
          <LinktripLeviers />
        </div>
      </section>

      {/* ── DÉMO ── */}
      <section id="demo" className={cx(styles.section, styles.bgMint)}>
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, styles.sectionHeadCenter, "rv")}>
            <span className={styles.eyebrow}>En pratique</span>
            <h2 style={{ marginTop: 12 }}>Concrètement, <span className={styles.gradText}>ça donne quoi&#8202;?</span></h2>
            <p>L&apos;achat des photos, la demande d&apos;avis Google, et bientôt le cross-sell de vos activités.</p>
          </div>
          <div className={styles.mdGrid}>
            {/* Achat des photos */}
            <div className={cx(styles.mdCard, "rv")}>
              <div className={styles.mdScreen}>
                <div className={styles.mdTop}>
                  <span className={styles.mdTitle}>Ma galerie</span>
                  <span className={styles.mdCart}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /><path d="M2 3h3l2.4 12h11l1.6-8H6" /></svg>
                    <b>1</b>
                  </span>
                </div>
                <div className={styles.mdGal}>
                  {["/hero-parasail.webp", "/solution-canyoning.webp", "/solution-canyoning.webp", "/hero-parasail.webp"].map((src, i) => (
                    <div key={i} className={styles.cell}>
                      <Image src={src} fill alt="" style={{ objectFit: "cover" }} sizes="150px" />
                      {i === 0 && (
                        <span className={styles.cellSel}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className={styles.mdBuybar}>
                  <div><div className={styles.lab}>Pack HD · 24 photos</div><div className={styles.pr}>20 €</div></div>
                  <button type="button" className={styles.mdBtn}>Acheter</button>
                </div>
              </div>
              <div className={styles.mdCap}>
                <h4>Achat des photos</h4>
                <p>Le client sélectionne, paie en deux clics, reçoit ses photos en HD.</p>
              </div>
            </div>

            {/* Demande d'avis */}
            <div className={cx(styles.mdCard, "rv", "d1")}>
              <div className={styles.mdScreen}>
                <div className={styles.mdTop}><span className={styles.mdTitle}>Votre expérience</span></div>
                <div className={styles.revBody}>
                  <div className={styles.revQ}>Vous avez aimé votre sortie&#8202;?</div>
                  <div className={styles.revStars}>★★★★★</div>
                  <button type="button" className={styles.mdBtn}>Laisser un avis Google</button>
                </div>
              </div>
              <div className={styles.mdCap}>
                <h4>Demande d&apos;avis</h4>
                <p>Au moment où le client est ravi, on l&apos;invite à noter votre structure sur Google.</p>
              </div>
            </div>

            {/* Cross-sell — bientôt */}
            <div className={cx(styles.mdCard, "rv", "d2")}>
              <div className={cx(styles.mdScreen, styles.mdScreenSoon)}>
                <div className={styles.mdTop}>
                  <span className={styles.mdTitle}>Et après&#8202;?</span>
                  <span className={styles.soonBadge}>À venir</span>
                </div>
                <div className={styles.xsell}>
                  {["Jet-ski", "Rafting", "Surf"].map((name) => (
                    <div key={name} className={styles.xsItem}>
                      <span className={styles.pic} style={{ background: "var(--line)" }} />
                      <span className={styles.nm}>{name}</span>
                      <span className={styles.pr}>-10% pour vos clients</span>
                      <span className={styles.go}>Réserver</span>
                    </div>
                  ))}
                </div>
                <div className={styles.soonTag}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                  Bientôt disponible
                </div>
              </div>
              <div className={styles.mdCap}>
                <h4>Cross-sell d&apos;activité <span className={styles.soonBadge}>Bientôt</span></h4>
                <p>Proposez vos autres prestations au meilleur moment. Fonctionnalité à venir.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={cx(styles.section, styles.bgPeach)} id="features">
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, "rv")}>
            <span className={styles.eyebrow}>Côté opérationnel</span>
            <h2 style={{ marginTop: 12 }}>Pensé pour ne rien vous demander.</h2>
            <p>Accès, paiement, tableau de bord, fidélisation&#8202;: l&apos;essentiel est déjà là, le reste arrive vite.</p>
          </div>
          <div className={styles.featGrid}>
            {[
              { title: "Accès QR code ou lien", desc: "Chaque participant retrouve ses photos, sans compte à créer.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="4" y="4" width="7" height="7" rx="1.4" /><rect x="13" y="4" width="7" height="7" rx="1.4" /><rect x="4" y="13" width="7" height="7" rx="1.4" /><path d="M13 13h3v3M20 20v.01M16 20h1" /></svg> },
              { title: "Tableau de bord", desc: "Revenus, panier moyen et taux d'achat par sortie, en temps réel.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg> },
              { title: "Print-on-demand", desc: "Bientôt : tirages, posters et albums imprimés en Europe, livrés chez le client.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M6 2v20l6-4 6 4V2z" /></svg>, soon: true },
              { title: "Merch à votre marque", desc: "Bientôt : t-shirts, casquettes et sweats à votre logo, sans stock.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" /></svg>, soon: true },
              { title: "Paiements sécurisés", desc: "Encaissement direct, reversement automatique, aucune avance.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></svg> },
              { title: "Avis & parrainage", desc: "Avis Google au bon moment, code de parrainage dans chaque partage.", icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7.4L12 17l-6.3 4.4L8 14 2 9.4h7.6z" /></svg> },
            ].map((f, i) => (
              <div key={f.title} className={cx(styles.feat, f.soon && styles.featSoon, "rv", i % 3 === 1 && "d1", i % 3 === 2 && "d2")}>
                <div className={styles.ic}>{f.icon}</div>
                <h4>{f.title} {f.soon && <span className={styles.soonBadge}>Bientôt</span>}</h4>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RDV ── */}
      <section className={styles.section} id="rdv" style={{ paddingTop: 20 }}>
        <div className={styles.container}>
          <div className={cx(styles.statsPanel, "rv")} style={{ textAlign: "center" }}>
            <span className={styles.eyebrow}>Discutons-en</span>
            <h2 style={{ marginTop: 12, maxWidth: "16ch", marginLeft: "auto", marginRight: "auto" }}>
              Envie d&apos;en parler&#8202;? Prenons 20&#8239;minutes.
            </h2>
            <p className={styles.ctaLead}>
              Je vous montre comment Linktrip s&apos;installe sur vos sorties, et on regarde ensemble si c&apos;est
              fait pour vous. Sans engagement.
            </p>
            <a
              className={styles.ctaWhite}
              href={process.env.NEXT_PUBLIC_CALENDLY_URL || "mailto:hello@linktrip.co"}
              target={process.env.NEXT_PUBLIC_CALENDLY_URL ? "_blank" : undefined}
              rel={process.env.NEXT_PUBLIC_CALENDLY_URL ? "noopener" : undefined}
            >
              Réserver un créneau <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── PARTENAIRES FONDATEURS ── */}
      <section className={styles.section} id="fondateurs" style={{ paddingTop: 20 }}>
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, "rv")}>
            <span className={styles.eyebrow}>Programme de lancement</span>
            <h2 style={{ marginTop: 12 }}>Devenez l&apos;une des premières structures.</h2>
            <p>
              Linktrip se lance cet été avec un petit groupe de prestataires outdoor. Voilà ce que vous y gagnez en
              étant parmi les premiers.
            </p>
          </div>
          <div className={styles.quotes}>
            <div className={cx(styles.quote, "rv")}>
              <div className={styles.ppIc}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg></div>
              <h4 className={styles.ppT}>Accompagnement direct</h4>
              <p>Je vous installe et je reste joignable. On ajuste ensemble ce qui manque, sortie après sortie.</p>
            </div>
            <div className={cx(styles.quote, "rv", "d1")}>
              <div className={styles.ppIc}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4 12.4 21.6a2 2 0 0 1-2.8 0l-6.2-6.2a2 2 0 0 1 0-2.8L11.6 3.6A2 2 0 0 1 13 3h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.4 1.4Z" /><circle cx="8" cy="8" r="1.3" /></svg></div>
              <h4 className={styles.ppT}>Conditions fondateur</h4>
              <p>Tarif de lancement gelé et accès prioritaire aux nouvelles fonctionnalités, avant tout le monde.</p>
            </div>
            <div className={cx(styles.quote, "rv", "d2")}>
              <div className={styles.ppIc}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg></div>
              <h4 className={styles.ppT}>Zéro risque</h4>
              <p>0&#8239;€ pour démarrer. Vous ne payez qu&apos;une commission sur les ventes réellement réalisées.</p>
            </div>
          </div>
          <div className={cx(styles.ppCta, "rv")}>
            <a href="#rdv" className={styles.ppLink}>
              Envie d&apos;en être&#8202;? Réservez un échange <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={cx(styles.section, styles.bgRose)} id="faq">
        <div className={styles.container}>
          <div className={cx(styles.sectionHead, styles.sectionHeadCenter, "rv")}>
            <span className={styles.eyebrow}>Questions fréquentes</span>
            <h2 style={{ marginTop: 12 }}>Ce qu&apos;il faut savoir avant de commencer.</h2>
          </div>
          <div className={cx(styles.faq, "rv", "d1")}>
            {[
              { q: "Faut-il du matériel ou une application&#8202;?", a: "Non. Vos guides photographient comme d'habitude. Linktrip s'occupe du reste.", open: true },
              { q: "Comment êtes-vous rémunérés&#8202;?", a: "Une commission sur les ventes, rien d'autre. Pas d'abonnement, pas d'engagement. Une galerie qui ne vend pas ne coûte rien." },
              { q: "Comment le client retrouve-t-il ses photos&#8202;?", a: "Un QR code sur place, ou un lien. Les photos sont triées automatiquement : chacun retrouve les siennes." },
              { q: "Combien de temps pour être opérationnel&#8202;?", a: "Une après-midi. Vous réglez votre marque et vos tarifs, puis vous publiez votre première galerie le jour même." },
              { q: "À qui appartiennent les données clients&#8202;?", a: "À vous. Hébergement européen, conformité RGPD. Linktrip travaille pour votre structure, pas l'inverse." },
            ].map((item) => (
              <details key={item.q} open={item.open}>
                <summary>
                  <span dangerouslySetInnerHTML={{ __html: item.q }} />
                  <span className={styles.pm}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </summary>
                <div className={styles.ans}>{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className={styles.section} id="creer" style={{ paddingTop: 20 }}>
        <div className={styles.container}>
          <div className={cx(styles.final, "rv")}>
            <div>
              <h2>Faites de la prochaine sortie un revenu.</h2>
              <p>
                Réglez votre marque et vos tarifs, publiez votre première galerie. On vous accompagne pour démarrer.
              </p>
              <a className={cx(styles.btn, styles.btnWhite, styles.btnLg)} href="/signup">
                Créer ma boutique <span className={styles.arrow}>→</span>
              </a>
              <div className={styles.fine}>Gratuit pour démarrer · Sans engagement</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footGrid}>
            <div className={styles.footBrand}>
              <a href="#top" className={styles.brand}>Linktrip</a>
              <p>Le souvenir qui prolonge l&apos;expérience et fait vivre votre activité, bien après la sortie.</p>
            </div>
            <div className={styles.footCol}>
              <h6>Produit</h6>
              <a href="#solution">Aperçu</a><a href="#steps">Fonctionnement</a><a href="#revenus">Revenus</a><a href="/signup">Créer ma boutique</a>
            </div>
            <div className={styles.footCol}>
              <h6>Ressources</h6>
              <a href="#faq">FAQ</a><a href="#tarifs">Tarifs</a><a href="mailto:hello@linktrip.co">Contact</a>
            </div>
            <div className={styles.footCol}>
              <h6>Légal</h6>
              <a href="/confidentialite">Confidentialité</a><a href="/cgu">Conditions</a><a href="/confidentialite">RGPD</a>
            </div>
          </div>
          <div className={styles.footBottom}>
            <span>© 2026 Linktrip · Entre Paris et Annecy</span>
            <div className={styles.soc}>
              <a href="https://instagram.com/linktrip">Instagram</a>
              <a href="https://linkedin.com">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>

      <LinktripMobileBar />
    </div>
  );
}
