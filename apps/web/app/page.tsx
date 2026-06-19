import Image from "next/image";
import { Nav } from "@/components/marketing/Nav";
import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-canvas">
      <div
        className="pointer-events-none absolute -top-48 right-[-15%] h-[34rem] w-[34rem] rounded-full opacity-[0.18] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />
      <div
        className="pointer-events-none absolute left-[-10%] top-[60vh] h-[28rem] w-[28rem] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="relative z-10 px-4 pt-4 sm:px-6">
        <Nav />
      </div>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto grid max-w-5xl gap-10 px-6 pb-24 pt-12 sm:pt-20 md:grid-cols-2 md:items-center">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card">
            🪂 Parapente · Canyoning · Rafting · Nautique
          </span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Augmente tes revenus.
            <br />
            <span
              style={{
                backgroundImage: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Booste ta visibilité.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg md:mx-0">
            Souvenir envoie automatiquement les photos et vidéos de tes clients
            après chaque session. Ils partagent, laissent un avis, tu encaisses.{" "}
            <strong className="font-semibold text-ink">Zéro gestion, 100&nbsp;% automatique.</strong>
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <ButtonLink href="/signup" size="lg">
              Démarrer gratuitement
            </ButtonLink>
            <ButtonLink href="#comment-ca-marche" variant="secondary" size="lg">
              Voir comment ça marche
            </ButtonLink>
          </div>

          <p className="mt-4 text-xs text-muted md:text-left text-center">
            Onboarding en quelques minutes · Pas de frais fixes
          </p>
        </div>

        {/* Visual desktop */}
        <div className="relative mx-auto hidden h-[36rem] w-full md:block">
          {/* Scattered cards — left */}
          <ScatteredCard photo="/hero-paragliding.jpg" label="Vol biplace" sub="Annecy · Haute-Savoie" width={108} className="absolute left-[3%] top-4 -rotate-[13deg]" />
          <ScatteredCard gradient="linear-gradient(160deg,#34D399,#059669)" label="Canyoning" sub="Verdon · PACA" width={84} className="absolute left-[-1%] top-[35%] -rotate-[4deg]" />
          <ScatteredCard photo="/hero-jetski.jpg" label="Jet ski" sub="Antibes · Côte d'Azur" width={94} className="absolute left-[5%] bottom-8 rotate-[7deg]" />

          {/* Central phone */}
          <GalleryPhone className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[52%]" />

          {/* Scattered cards — right */}
          <ScatteredCard photo="/hero-paragliding.jpg" label="Parapente" sub="Chamonix · Haute-Savoie" width={102} className="absolute right-[4%] top-3 rotate-[11deg]" />
          <ScatteredCard gradient="linear-gradient(160deg,#38BDF8,#0284C7)" label="Rafting" sub="Ardèche · Occitanie" width={86} className="absolute right-[-1%] top-[33%] rotate-[4deg]" />
          <ScatteredCard gradient="linear-gradient(160deg,#FB923C,#EA580C)" label="Via ferrata" sub="Grenoble · Isère" width={90} className="absolute right-[3%] bottom-6 -rotate-[9deg]" />

          {/* Floating badges */}
          <FloatingBadge
            className="absolute right-[14%] top-3 rotate-[2deg]"
            icon={<StarIcon />}
            iconBg="#FEF9C3"
            iconColor="#CA8A04"
            label="+12 avis Google ce mois"
          />
          <FloatingBadge
            className="absolute bottom-32 left-[13%] -rotate-[1deg]"
            icon={<EuroIcon />}
            iconBg="#DCFCE7"
            iconColor="#16A34A"
            label="1 240 € encaissés"
          />
          <FloatingBadge
            className="absolute bottom-12 right-[13%] rotate-[1deg]"
            icon={<ShareIcon />}
            iconBg="#EEF2FF"
            iconColor="#4F46E5"
            label="28 partages Instagram"
          />
        </div>

        {/* Visual mobile */}
        <div className="mx-auto flex justify-center md:hidden">
          <GalleryPhone />
        </div>
      </section>

      {/* ─── 3 piliers ─── */}
      <section className="relative z-10 bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">
              Trois résultats. Une seule action.
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Tes clients sont ton meilleur levier marketing.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-ink-2">
              La photo n&apos;est que le moyen. Souvenir l&apos;utilise pour générer des revenus,
              de la visibilité et t&apos;enlever toute la gestion.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <PillarCard
              gradient="linear-gradient(135deg, #DCFCE7 0%, #A7F3D0 100%)"
              iconGradient="linear-gradient(135deg, #16A34A, #065F46)"
              icon={<EuroIcon />}
              title="Revenus passifs"
              description="Chaque client reçoit ses photos en aperçu. Pour les débloquer en HD, il paye. Tu touches 80 % — sans rien faire."
              stat="~29 € par achat"
            />
            <PillarCard
              gradient="linear-gradient(135deg, #FEF9C3 0%, #FDE68A 100%)"
              iconGradient="linear-gradient(135deg, #CA8A04, #92400E)"
              icon={<MegaphoneIcon />}
              title="Visibilité organique"
              description="Une belle galerie = une photo partagée sur Instagram, un avis Google laissé. Chaque aventure devient de la pub gratuite."
              stat="3× plus d'avis"
            />
            <PillarCard
              gradient="linear-gradient(135deg, #EEF2FF 0%, #C7D2FE 100%)"
              iconGradient="linear-gradient(135deg, #4F46E5, #7C3AED)"
              icon={<BoltIcon />}
              title="Zéro gestion"
              description="Envoi automatique, paiement intégré, consentements RGPD horodatés. Souvenir s'occupe de tout."
              stat="< 2 min par session"
            />
          </div>
        </div>
      </section>

      {/* ─── Comment ça marche ─── */}
      <section id="comment-ca-marche" className="relative z-10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Comment ça marche</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Simple pour toi. Magique pour tes clients.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <StepCard
              step="1"
              tint="#EEF2FF"
              color="#4F46E5"
              title="Upload en 2 minutes"
              description="Après chaque session, ton moniteur sélectionne les médias depuis son téléphone. Même en 4G pourrie."
            />
            <StepCard
              step="2"
              tint="#DCFCE7"
              color="#16A34A"
              title="La galerie se crée toute seule"
              description="Chaque client reçoit un lien personnel par email ou SMS. Sa galerie s'ouvre sans app, sans compte."
            />
            <StepCard
              step="3"
              tint="#FEF9C3"
              color="#CA8A04"
              title="Il achète, partage, commente"
              description="Paiement HD en un clic, partage Instagram, avis Google. Toi, tu vois tout dans ton dashboard."
            />
          </div>

          {/* Timeline connector */}
          <div className="relative mt-12 overflow-hidden rounded-card border border-border bg-surface p-6 sm:p-8 shadow-card">
            <div
              className="pointer-events-none absolute right-0 top-0 h-full w-1/3 rounded-r-card"
              style={{ background: "linear-gradient(to right, transparent, var(--accent-tint))" }}
            />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-around sm:gap-0">
              <Metric label="Délai moyen upload → galerie" value="< 2 min" />
              <div className="hidden h-10 w-px bg-border sm:block" />
              <Metric label="Taux d'achat observé (pilote)" value="≥ 20 %" />
              <div className="hidden h-10 w-px bg-border sm:block" />
              <Metric label="Part opérateur sur chaque vente" value="80 %" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Conformité RGPD ─── */}
      <section className="relative z-10 bg-surface py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-start sm:text-left">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">
              <ShieldIcon />
            </span>
            <div>
              <h3 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                Conformité RGPD incluse, sans effort.
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2 sm:text-base">
                Consentements image et email horodatés, droit à l&apos;effacement, rétention 90 jours — tout est géré automatiquement.
                Tu livres tes clients en toute sérénité.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA band ─── */}
      <section className="relative z-10 mx-6 mb-6 overflow-hidden rounded-card bg-ink px-6 py-16 text-center sm:mx-auto sm:max-w-5xl sm:px-12">
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative z-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-canvas sm:text-4xl">
            Prêt à transformer chaque session en levier de croissance ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-canvas/70 sm:text-base">
            Onboarding en quelques minutes. Lance ta première galerie aujourd&apos;hui.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">
              Démarrer gratuitement
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-light" size="lg">
              J&apos;ai déjà un compte
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-1 px-6 pb-10 text-center text-xs text-muted">
        <span>© {new Date().getFullYear()} Souvenir — outil marketing pour activités outdoor</span>
      </footer>
    </main>
  );
}

/* ─── Social Card ─── */
/* ─── Gallery Phone Mockup ─── */
function GalleryPhone({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: 210, height: 428 }}>
      {/* Body */}
      <div
        className="absolute inset-0 rounded-[38px] bg-[#1C1C1E]"
        style={{
          boxShadow:
            "0 36px 90px -14px rgba(0,0,0,0.38), 0 10px 28px -6px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      />
      {/* Side buttons */}
      <div className="absolute -right-[3px] top-[86px] h-[48px] w-[3px] rounded-r-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[76px] h-[30px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[114px] h-[54px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[176px] h-[54px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      {/* Screen */}
      <div className="absolute inset-[3px] overflow-hidden rounded-[35px] bg-[#FAF7F4]">
        {/* Status bar */}
        <div className="relative flex h-9 items-center justify-between bg-[#FAF7F4] px-4 pt-1">
          <span className="text-[9px] font-semibold text-[#1F1B17]">17:34</span>
          <div className="absolute left-1/2 top-2 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-[#1C1C1E]" />
          <svg viewBox="0 0 28 9" className="h-2 w-5 fill-[#1F1B17]">
            <rect x="0" y="5" width="3" height="4" rx="0.5" />
            <rect x="4.5" y="3" width="3" height="6" rx="0.5" />
            <rect x="9" y="1" width="3" height="8" rx="0.5" />
            <rect x="13.5" y="0" width="3" height="9" rx="0.5" opacity="0.25" />
            <rect x="21" y="0" width="7" height="7" rx="1.5" fill="none" stroke="#1F1B17" strokeWidth="1" />
            <rect x="22" y="1.5" width="4" height="4" rx="0.8" />
          </svg>
        </div>
        {/* Operator header */}
        <div className="flex items-center gap-2 px-3 pb-1.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#4F46E5]">
            <span className="text-[8px] font-bold text-white">VP</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-[#1F1B17]">Vol Passion Annecy</p>
            <p className="text-[7.5px] text-[#A89C90]">Annecy · 14 juin · 14 photos</p>
          </div>
        </div>
        {/* Hero photo */}
        <div className="relative mx-2.5 overflow-hidden rounded-[14px]" style={{ height: 202 }}>
          <Image src="/hero-paragliding.jpg" fill className="object-cover" alt="" sizes="200px" />
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-2.5 left-2.5">
            <p className="text-[10px] font-bold leading-tight text-white">Le vol de Léa 🤩</p>
            <p className="text-[7.5px] text-white/70">14 photos · 2 vidéos</p>
          </div>
          {/* lock on last */}
        </div>
        {/* Grid */}
        <div className="mx-2.5 mt-[3px] grid grid-cols-3 gap-[2px]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="relative aspect-square overflow-hidden rounded-[5px]">
              <Image
                src={i === 1 ? "/hero-jetski.jpg" : "/hero-paragliding.jpg"}
                fill
                className="object-cover"
                alt=""
                sizes="60px"
              />
              {i === 2 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-white">
                    <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* CTA */}
        <div
          className="mx-2.5 mt-2 rounded-full py-2.5 text-center text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)" }}
        >
          Débloquer mes souvenirs
        </div>
      </div>
    </div>
  );
}

/* ─── Scattered Photo Card ─── */
function ScatteredCard({
  photo,
  gradient,
  label,
  sub,
  className = "",
  width = 100,
}: {
  photo?: string;
  gradient?: string;
  label: string;
  sub?: string;
  className?: string;
  width?: number;
}) {
  const height = Math.round(width * (16 / 9));
  return (
    <div
      className={`overflow-hidden rounded-[14px] ring-1 ring-black/5 ${className}`}
      style={{
        width,
        height,
        boxShadow: "0 12px 36px -6px rgba(0,0,0,0.18), 0 3px 10px -3px rgba(0,0,0,0.10)",
      }}
    >
      {photo ? (
        <div className="relative h-full w-full">
          <Image src={photo} fill className="object-cover" alt={label} sizes={`${width}px`} />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-2">
            <p className="truncate text-[9px] font-semibold leading-tight text-white">{label}</p>
            {sub && <p className="truncate text-[7px] leading-tight text-white/65">{sub}</p>}
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full flex flex-col justify-end p-2" style={{ background: gradient }}>
          <p className="text-[9px] font-semibold leading-tight text-white">{label}</p>
          {sub && <p className="text-[7px] leading-tight text-white/65">{sub}</p>}
        </div>
      )}
    </div>
  );
}

/* ─── Floating Badge ─── */
function FloatingBadge({
  className = "",
  icon,
  iconBg,
  iconColor,
  label,
}: {
  className?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 shadow-card ${className}`}
    >
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <span className="whitespace-nowrap text-xs font-semibold text-ink">{label}</span>
    </div>
  );
}

/* ─── Pillar Card ─── */
function PillarCard({
  gradient,
  iconGradient,
  icon,
  title,
  description,
  stat,
}: {
  gradient: string;
  iconGradient: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  stat: string;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Tinted top band */}
      <div className="flex items-center gap-3 p-5 pb-4" style={{ background: gradient }}>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow"
          style={{ background: iconGradient }}
        >
          {icon}
        </span>
        <p className="text-base font-bold text-ink">{title}</p>
      </div>
      <div className="flex flex-1 flex-col p-5 pt-4">
        <p className="flex-1 text-sm leading-relaxed text-ink-2">{description}</p>
        <p className="mt-4 text-sm font-bold text-ink">{stat}</p>
      </div>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  step,
  tint,
  color,
  title,
  description,
}: {
  step: string;
  tint: string;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-6 shadow-card">
      <span
        className="flex h-10 w-10 items-center justify-center rounded-full font-display text-lg font-extrabold"
        style={{ background: tint, color }}
      >
        {step}
      </span>
      <p className="mt-4 text-base font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-sm text-ink-2">{description}</p>
    </div>
  );
}

/* ─── Metric ─── */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 sm:items-center">
      <span className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{value}</span>
      <span className="text-xs text-ink-2">{label}</span>
    </div>
  );
}

/* ─── Icons ─── */
function EuroIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M11 4.5a4 4 0 1 0 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 7h6M3 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M2 6.5v3h2l4 3V3.5L4 6.5H2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 5c.83.7 1.4 1.7 1.4 3s-.57 2.3-1.4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M9 2L4 9h5l-2 5 7-7H9l2-5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
      <path
        d="M7 1l1.55 3.14L12 4.64l-2.5 2.43.59 3.43L7 8.77 4.91 10.5l.59-3.43L3 4.64l3.45-.5L7 1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
      <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M4.3 6.3L9.7 3.7M4.3 7.7l5.4 2.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M12 3L4 6v6c0 4.4 3.4 8.5 8 9.5 4.6-1 8-5.1 8-9.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
