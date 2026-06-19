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

      {/* ─── Feature 1 : Galerie client ─── */}
      <section id="comment-ca-marche" className="relative z-10 bg-surface py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Pour tes clients</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Une galerie personnalisée,<br />livrée instantanément.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              Ton moniteur uploade depuis son téléphone — même en 4G pourrie. Chaque client reçoit
              son lien par email ou SMS. La galerie s&apos;ouvre sans app, sans compte.
            </p>
            <div className="mt-8 inline-flex items-end gap-3">
              <span className="font-display text-5xl font-extrabold text-ink">&lt;&nbsp;2&nbsp;min</span>
              <span className="mb-1.5 text-sm text-ink-2">entre l&apos;upload et<br />la galerie disponible</span>
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <GalleryPhone />
          </div>
        </div>
      </section>

      {/* ─── Feature 2 : Encaissement — dark ─── */}
      <section className="relative z-10 overflow-hidden bg-ink py-20 md:py-28">
        <div
          className="pointer-events-none absolute -top-32 right-[-10%] h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
          <div className="flex justify-center md:justify-start">
            <CheckoutPhone />
          </div>
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Pour toi</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-canvas sm:text-4xl">
              Tu touches 80 %<br />sur chaque vente.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-canvas/70">
              En mode Boutique, tes clients débloquent leurs photos en HD en un clic. Stripe vire
              ta part automatiquement — tu ne touches à rien.
            </p>
            <div className="mt-8 inline-flex items-end gap-3">
              <span className="font-display text-5xl font-extrabold text-canvas">~29&nbsp;€</span>
              <span className="mb-1.5 text-sm text-canvas/60">par achat<br />en moyenne</span>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-canvas/50">
              <ShieldIcon />
              <span>Consentements RGPD horodatés, rétention 90 j.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Feature 3 : Dashboard zéro gestion ─── */}
      <section className="relative z-10 bg-canvas py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Pour ton école</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Souvenir s&apos;occupe<br />de tout. Vraiment.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              Envoi automatique, paiement Stripe intégré, avis Google collectés, dashboard
              en temps réel. Toi, tu fais du sport.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Envoi email + SMS automatique à chaque client",
                "Split 80/20 versé sans action de ta part",
                "Attach rate, GMV, funnel : tout dans ton dashboard",
                "Onboarding en quelques minutes, 0 € fixe",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-2">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#16A34A]">
                    <svg viewBox="0 0 12 12" fill="none" className="h-3 w-3" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center md:justify-end">
            <DashboardPreview />
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

/* ─── Checkout Phone ─── */
function CheckoutPhone({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: 210, height: 428 }}>
      <div
        className="absolute inset-0 rounded-[38px] bg-[#1C1C1E]"
        style={{ boxShadow: "0 36px 90px -14px rgba(0,0,0,0.5), 0 10px 28px -6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)" }}
      />
      <div className="absolute -right-[3px] top-[86px] h-[48px] w-[3px] rounded-r-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[76px] h-[30px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[114px] h-[54px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      <div className="absolute -left-[3px] top-[176px] h-[54px] w-[3px] rounded-l-full bg-[#2C2C2E]" />
      <div className="absolute inset-[3px] overflow-hidden rounded-[35px] bg-[#FAF7F4]">
        {/* Status bar */}
        <div className="relative flex h-9 items-center justify-between bg-[#FAF7F4] px-4 pt-1">
          <span className="text-[9px] font-semibold text-[#1F1B17]">17:34</span>
          <div className="absolute left-1/2 top-2 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-[#1C1C1E]" />
        </div>
        {/* Locked preview */}
        <div className="relative mx-2.5 overflow-hidden rounded-[14px]" style={{ height: 160 }}>
          <Image src="/hero-paragliding.jpg" fill className="object-cover" alt="" sizes="200px" style={{ filter: "blur(6px)", transform: "scale(1.05)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 text-white">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[10px] font-semibold text-white">14 photos · 2 vidéos</p>
          </div>
        </div>
        {/* Checkout card */}
        <div className="mx-2.5 mt-3 overflow-hidden rounded-[14px] border border-[#ECE4DC] bg-white">
          <div className="flex items-start justify-between p-3 pb-2">
            <div>
              <p className="text-[11px] font-bold text-[#1F1B17]">Pack HD · Vol Passion Annecy</p>
              <p className="text-[9px] text-[#A89C90]">14 photos + 2 vidéos originaux</p>
            </div>
            <span className="font-display text-[15px] font-extrabold text-[#1F1B17]">29 €</span>
          </div>
          <div className="mx-3 mb-2 flex items-center gap-2 rounded-[8px] border border-[#ECE4DC] bg-[#FAF7F4] px-2.5 py-2">
            <svg viewBox="0 0 16 12" fill="none" className="h-3 w-3.5 shrink-0 text-[#A89C90]">
              <rect x="0.5" y="0.5" width="15" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M0 4h16" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="text-[9px] text-[#A89C90]">•••• •••• •••• 4242</span>
          </div>
          <div
            className="mx-3 mb-3 rounded-full py-2.5 text-center text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)" }}
          >
            Payer 29 €
          </div>
        </div>
        {/* Powered by */}
        <p className="mt-1.5 text-center text-[8px] text-[#A89C90]">Paiement sécurisé · Stripe</p>
      </div>
    </div>
  );
}

/* ─── Dashboard Preview ─── */
function DashboardPreview() {
  return (
    <div
      className="w-full max-w-[340px] overflow-hidden rounded-[20px] bg-white"
      style={{ boxShadow: "0 24px 60px -10px rgba(0,0,0,0.16), 0 8px 20px -4px rgba(0,0,0,0.08)" }}
    >
      <div className="flex items-center justify-between border-b border-[#ECE4DC] px-5 py-4">
        <div>
          <p className="text-[10px] text-[#A89C90]">Session du jour</p>
          <p className="text-[13px] font-semibold text-[#1F1B17]">Vendredi 14 juin</p>
        </div>
        <span className="rounded-full bg-[#EAF7EE] px-2.5 py-1 text-[10px] font-semibold text-[#16A34A]">
          3 livrées
        </span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[#ECE4DC]">
        {[
          { value: "24 %", label: "Attach rate" },
          { value: "87 €", label: "GMV" },
          { value: "3", label: "Galeries" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-4 text-center">
            <p className="font-display text-[19px] font-extrabold text-[#1F1B17]">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-[#A89C90]">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#F3EDE7]">
        {[
          { name: "Léa Martin", tag: "Payé ✓", amount: "29 €", tagCls: "text-[#16A34A] bg-[#EAF7EE]" },
          { name: "Tom Durand", tag: "Ouvert", amount: "—", tagCls: "text-[#4F46E5] bg-[#EEF2FF]" },
          { name: "Emma Petit", tag: "Envoyé", amount: "—", tagCls: "text-[#6E6259] bg-[#ECE4DC]" },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-[10px] font-semibold text-[#4F46E5]">
                {item.name[0]}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#1F1B17]">{item.name}</p>
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${item.tagCls}`}>{item.tag}</span>
              </div>
            </div>
            <span className="text-[12px] font-semibold text-[#1F1B17]">{item.amount}</span>
          </div>
        ))}
      </div>
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
