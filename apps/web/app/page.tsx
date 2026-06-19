import Image from "next/image";
import { Nav } from "@/components/marketing/Nav";
import { ButtonLink } from "@/components/ui/Button";
import { HeroForm } from "@/components/marketing/HeroForm";
import { RevenueSimulator } from "@/components/marketing/RevenueSimulator";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-canvas pt-[72px]">
      <div
        className="pointer-events-none absolute -top-48 right-[-15%] h-[34rem] w-[34rem] rounded-full opacity-[0.18] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />
      <div
        className="pointer-events-none absolute left-[-10%] top-[60vh] h-[28rem] w-[28rem] rounded-full opacity-[0.10] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
        <Nav />
      </div>

      {/* ─── Hero ─── */}
      <section className="relative z-10 mx-auto grid max-w-5xl gap-12 px-6 pb-32 pt-16 sm:pt-28 md:grid-cols-2 md:items-center md:gap-16">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card">
            🪂 Parapente · Canyoning · Rafting · Nautique
          </span>

          <h1 className="mt-8 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[56px]">
            Augmentez vos revenus.
            <br />
            <span
              style={{
                backgroundImage: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Boostez votre visibilité.
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg md:mx-0">
            Souvenir envoie automatiquement les photos et vidéos de vos clients
            après chaque session. Ils partagent, laissent un avis, vous encaissez.{" "}
            <strong className="font-semibold text-ink">Zéro gestion, 100&nbsp;% automatique.</strong>
          </p>

          <HeroForm />
        </div>

        {/* Visual — desktop : fan layout */}
        <div className="relative mx-auto hidden md:flex items-center justify-center" style={{ width: 540, height: 480 }}>
          {/* Photo gauche — éventail */}
          <div
            className="absolute z-0"
            style={{ transform: "translateX(-105px) rotate(-16deg)", transformOrigin: "center bottom" }}
          >
            <UnlockedCard src="/hero-surf.jpg" width={200} height={410} />
          </div>

          {/* Photo droite — éventail */}
          <div
            className="absolute z-0"
            style={{ transform: "translateX(105px) rotate(16deg)", transformOrigin: "center bottom" }}
          >
            <UnlockedCard src="/hero-rafting.jpg" width={200} height={410} />
          </div>

          {/* Téléphone — devant, léger tilt 3D */}
          <div
            className="absolute z-10"
            style={{ transform: "perspective(1200px) rotateY(-4deg) rotateX(2deg)" }}
          >
            <GalleryPhone />
          </div>

          {/* Badge revenus */}
          <FloatingBadge
            className="absolute bottom-[2%] left-[4%] -rotate-[1deg] z-20"
            icon={<EuroIcon />}
            iconBg="#DCFCE7"
            iconColor="#16A34A"
            label="1 240 € encaissés"
          />
          {/* Badge Instagram */}
          <FloatingBadge
            className="absolute top-[3%] right-[4%] rotate-[2deg] z-20"
            icon={<InstagramIcon />}
            iconBg="linear-gradient(135deg,#F9CE34,#EE2A7B,#6228D7)"
            iconColor="#fff"
            label="@volpassionannecy"
          />
        </div>

        {/* Visual — mobile */}
        <div className="flex justify-center md:hidden">
          <GalleryPhone />
        </div>
      </section>

      {/* ─── Comment ça marche — 4 étapes ─── */}
      <section id="comment-ca-marche" className="relative z-10 bg-surface py-24 md:py-36">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-20 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Comment ça marche</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              De la session à l&apos;encaissement,<br />en quelques minutes.
            </h2>
          </div>

          <div className="space-y-24 md:space-y-28">

            {/* Étape 1 — Upload · texte gauche, illustration droite */}
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
              {/* Texte */}
              <div>
                <span className="font-display text-6xl font-extrabold text-border">01</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Vous uploadez vos photos</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Sélectionnez vos photos et vidéos depuis votre pellicule, en 3 taps. Les transferts reprennent automatiquement en cas de coupure réseau.
                </p>
              </div>
              {/* Illustration — grille de vignettes */}
              <div className="overflow-hidden rounded-card border border-border bg-canvas p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-tint">
                      <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5 text-brand">
                        <path d="M6 9V3M3.5 5.5 6 3l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-ink">Envoi en cours</span>
                  </div>
                  <span className="text-xs font-medium text-[#16A34A]">3 / 6 envoyées</span>
                </div>
                {/* Photo grid */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Done */}
                  {["/hero-surf.jpg", "/hero-canyoning.jpg", "/hero-rafting.jpg"].map((src) => (
                    <div key={src} className="relative aspect-square overflow-hidden rounded-[10px]">
                      <Image src={src} fill className="object-cover" alt="" sizes="120px" />
                      <div className="absolute inset-0 bg-black/10" />
                      <div className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#16A34A]">
                        <svg viewBox="0 0 10 10" fill="none" className="h-3 w-3"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  ))}
                  {/* 67% */}
                  <div className="relative aspect-square overflow-hidden rounded-[10px]">
                    <Image src="/hero-paragliding.jpg" fill className="object-cover" alt="" sizes="120px" />
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <span className="text-sm font-extrabold text-white">67%</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div className="h-full bg-brand" style={{ width: "67%" }} />
                    </div>
                  </div>
                  {/* 23% */}
                  <div className="relative aspect-square overflow-hidden rounded-[10px]">
                    <Image src="/hero-jetski.jpg" fill className="object-cover" alt="" sizes="120px" />
                    <div className="absolute inset-0 bg-black/50" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                      <span className="text-sm font-extrabold text-white">23%</span>
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                      <div className="h-full bg-brand" style={{ width: "23%" }} />
                    </div>
                  </div>
                  {/* Queued */}
                  <div className="relative aspect-square overflow-hidden rounded-[10px]">
                    <Image src="/hero-canyoning.jpg" fill className="object-cover" alt="" sizes="120px"
                      style={{ filter: "grayscale(0.6)" }} />
                    <div className="absolute inset-0 bg-black/55" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-white/70">En attente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 — Répartition · illustration gauche, texte droite */}
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
              {/* Illustration */}
              <div className="overflow-hidden rounded-card border border-border bg-canvas p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Rotation 14h</p>
                    <p className="text-xs text-muted mt-0.5">18 photos importées · 3 clients</p>
                  </div>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF7EE]">
                    <svg viewBox="0 0 12 12" fill="none" className="h-3.5 w-3.5 text-[#16A34A]"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
                {/* Client rows */}
                <div className="space-y-2 mb-3">
                  {[
                    { name: "Léa M.",  count: 7, srcs: ["/hero-paragliding.jpg", "/hero-surf.jpg", "/hero-canyoning.jpg", "/hero-rafting.jpg"] },
                    { name: "Tom D.",  count: 6, srcs: ["/hero-rafting.jpg", "/hero-jetski.jpg", "/hero-surf.jpg", "/hero-paragliding.jpg"] },
                    { name: "Emma P.", count: 5, srcs: ["/hero-canyoning.jpg", "/hero-paragliding.jpg", "/hero-surf.jpg", "/hero-jetski.jpg"] },
                  ].map((client) => (
                    <div key={client.name} className="flex items-center gap-3 rounded-[12px] border border-border bg-surface px-3 py-2.5">
                      {/* Avatar + name */}
                      <div className="flex items-center gap-2 w-20 shrink-0">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[10px] font-bold text-brand">{client.name[0]}</div>
                        <span className="text-xs font-semibold text-ink truncate">{client.name}</span>
                      </div>
                      {/* Photo strip */}
                      <div className="flex flex-1 gap-1">
                        {client.srcs.map((src, i) => (
                          <div key={i} className="relative h-9 w-9 shrink-0 overflow-hidden rounded-[5px]">
                            <Image src={src} fill className="object-cover" alt="" sizes="36px" />
                            {i === 3 && client.count > 4 && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <span className="text-[9px] font-bold text-white">+{client.count - 4}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Count */}
                      <span className="shrink-0 text-[10px] text-muted">{client.count} photos</span>
                    </div>
                  ))}
                </div>
                {/* CTA */}
                <div className="rounded-[10px] bg-brand px-4 py-2.5 text-center">
                  <span className="text-sm font-bold text-white">Envoyer à tout le monde →</span>
                </div>
              </div>
              {/* Texte */}
              <div>
                <span className="font-display text-6xl font-extrabold text-border">02</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Vous répartissez par client</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Après l&apos;import groupé, attribuez chaque photo à la bonne personne en quelques secondes. Un clic suffit pour envoyer toutes les galeries d&apos;un coup.
                </p>
              </div>
            </div>

            {/* Étape 3 — Galerie & achat · texte gauche, illustration droite */}
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
              {/* Texte */}
              <div>
                <span className="font-display text-6xl font-extrabold text-border">03</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Le client débloque</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Il ouvre sa galerie, voit ses photos floutées, et achète le pack HD en un clic. Stripe encaisse et transfère votre part automatiquement.
                </p>
              </div>
              {/* Illustration */}
              <div className="overflow-hidden rounded-card border border-border bg-canvas">
                <div className="relative" style={{ height: 220 }}>
                  <Image src="/hero-paragliding.jpg" fill className="object-cover" alt="" sizes="480px"
                    style={{ filter: "blur(8px)", transform: "scale(1.08)" }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                      <svg viewBox="0 0 16 16" fill="none" className="h-7 w-7 text-white">
                        <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-white">14 photos · 2 vidéos</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between rounded-[14px] bg-[#4F46E5] px-5 py-3.5">
                    <span className="text-sm font-bold text-white">Débloquer mes souvenirs</span>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-extrabold text-white">29 €</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 4 — Dashboard · illustration gauche, texte droite */}
            <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
              {/* Illustration */}
              <div className="overflow-hidden rounded-card border border-border bg-surface">
                {/* CA hero */}
                <div className="border-b border-border px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">CA encaissé aujourd&apos;hui</p>
                  <div className="mt-1.5 flex items-end gap-2">
                    <span className="font-display text-4xl font-extrabold text-ink">290 €</span>
                    <span className="mb-1 text-sm font-medium text-[#16A34A]">↑ +87 € vs hier</span>
                  </div>
                </div>
                {/* Deliveries list */}
                <div className="divide-y divide-border">
                  {[
                    { name: "Léa Martin",  tag: "Achat ✓",  amount: "29 €", tagCls: "text-[#16A34A] bg-[#EAF7EE]" },
                    { name: "Tom Durand",  tag: "Achat ✓",  amount: "29 €", tagCls: "text-[#16A34A] bg-[#EAF7EE]" },
                    { name: "Camille Roy", tag: "Achat ✓",  amount: "29 €", tagCls: "text-[#16A34A] bg-[#EAF7EE]" },
                    { name: "Emma Petit",  tag: "Ouvert",   amount: "—",    tagCls: "text-brand bg-accent-tint" },
                    { name: "Marc Faure",  tag: "Envoyé",   amount: "—",    tagCls: "text-ink-2 bg-border" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center justify-between px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-canvas text-xs font-semibold text-ink-2">{r.name[0]}</div>
                        <p className="text-sm font-medium text-ink">{r.name}</p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.tagCls}`}>{r.tag}</span>
                        <span className="w-8 text-right text-sm font-semibold text-ink">{r.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Texte */}
              <div>
                <span className="font-display text-6xl font-extrabold text-border">04</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Vous suivez tout</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Taux d&apos;achat, CA encaissé, avis collectés : votre dashboard se met à jour en temps réel. Rien à configurer.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Simulateur de revenus — dark ─── */}
      <section className="relative z-10 overflow-hidden bg-ink py-24 md:py-32">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative mx-auto max-w-2xl px-6">
          <RevenueSimulator />
        </div>
      </section>

      {/* ─── Feature 3 : Dashboard zéro gestion ─── */}
      <section className="relative z-10 bg-canvas py-20 md:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2 md:gap-20">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Pour votre école</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl">
              Souvenir s&apos;occupe<br />de tout. Vraiment.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              Envoi automatique, paiement Stripe intégré, avis Google collectés, dashboard
              en temps réel. Vous faites du sport.
            </p>
            <ul className="mt-8 space-y-3">
              {[
                "Envoi email + SMS automatique à chaque client",
                "Split 80/20 versé sans action de votre part",
                "Attach rate, GMV, funnel : tout dans votre dashboard",
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
            Onboarding en quelques minutes. Lancez votre première galerie aujourd&apos;hui.
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

/* ─── Unlocked photo card ─── */
function UnlockedCard({ src, width, height: h, className = "" }: { src: string; width: number; height?: number; className?: string }) {
  const height = h ?? Math.round(width * 1.35);
  return (
    <div
      className={`overflow-hidden rounded-[18px] ${className}`}
      style={{
        width,
        height,
        boxShadow: "0 20px 50px -10px rgba(0,0,0,0.28), 0 6px 16px -4px rgba(0,0,0,0.14)",
      }}
    >
      <div className="relative h-full w-full">
        <Image src={src} fill className="object-cover" alt="" sizes={`${width}px`} />
      </div>
    </div>
  );
}

/* ─── Lock icon ─── */
function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 text-white">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Blurred tile ─── */
function BlurredTile({ src }: { src: string }) {
  return (
    <div className="relative aspect-square overflow-hidden rounded-[5px]">
      <Image
        src={src}
        fill
        className="object-cover"
        alt=""
        sizes="60px"
        style={{ filter: "blur(5px)", transform: "scale(1.08)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/35">
        <LockIcon />
      </div>
    </div>
  );
}

/* ─── Gallery Phone Mockup ─── */
function GalleryPhone({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} style={{ width: 218, height: 447 }}>
      {/* Body — gradient titanium */}
      <div
        className="absolute inset-0 rounded-[38px]"
        style={{
          background: "linear-gradient(155deg, #2E2E30 0%, #1C1C1E 55%)",
          boxShadow:
            "0 48px 96px -16px rgba(0,0,0,0.55), 14px 24px 48px -12px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      />
      {/* Chamfer highlight */}
      <div
        className="absolute inset-x-3 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)" }}
      />
      {/* Side buttons */}
      {([
        { side: "right", top: 90,  h: 50 },
        { side: "left",  top: 78,  h: 28 },
        { side: "left",  top: 116, h: 54 },
        { side: "left",  top: 180, h: 54 },
      ] as const).map(({ side, top, h }, i) => (
        <div
          key={i}
          className={`absolute ${side === "right" ? "-right-[3px] rounded-r-full" : "-left-[3px] rounded-l-full"}`}
          style={{ top, height: h, width: 3, background: "linear-gradient(180deg, #3A3A3C, #2A2A2C)" }}
        />
      ))}
      {/* Screen */}
      <div className="absolute inset-[3px] overflow-hidden rounded-[35px] bg-[#FAF7F4]">
        {/* Screen glare */}
        <div
          className="pointer-events-none absolute inset-0 z-30 rounded-[35px]"
          style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.08) 0%, transparent 50%)" }}
        />
        {/* Status bar */}
        <div className="relative flex h-9 items-center justify-between bg-[#FAF7F4] px-4 pt-1">
          <span className="text-[9px] font-semibold text-[#1F1B17]">17:34</span>
          <div className="absolute left-1/2 top-2 h-[18px] w-[64px] -translate-x-1/2 rounded-full bg-[#1C1C1E]" />
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
        {/* Hero photo — blurred */}
        <div className="relative mx-2.5 overflow-hidden rounded-[12px]" style={{ height: 198 }}>
          <Image
            src="/hero-paragliding.jpg"
            fill
            className="object-cover"
            alt=""
            sizes="194px"
            style={{ filter: "blur(8px)", transform: "scale(1.1)" }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/38">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/25">
              <svg viewBox="0 0 16 16" fill="none" style={{ width: 18, height: 18 }} className="text-white">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M5 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-[9.5px] font-semibold text-white">14 photos · 2 vidéos</p>
          </div>
        </div>
        {/* Grid — all blurred */}
        <div className="mx-2.5 mt-[3px] grid grid-cols-3 gap-[2px]">
          <BlurredTile src="/hero-rafting.jpg" />
          <BlurredTile src="/hero-surf.jpg" />
          <BlurredTile src="/hero-canyoning.jpg" />
        </div>
        {/* CTA */}
        <div
          className="mx-2.5 mt-2 flex items-center justify-center gap-2 rounded-full py-2.5"
          style={{ background: "linear-gradient(135deg, #818CF8 0%, #4F46E5 100%)" }}
        >
          <span className="text-[11px] font-bold text-white">Débloquer</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-extrabold text-white">29 €</span>
        </div>
        {/* Souvenir branding */}
        <div className="mt-2 mb-1 flex items-center justify-center gap-1 opacity-40">
          <svg viewBox="0 0 10 12" fill="none" style={{ width: 8, height: 10 }}>
            <rect x="1" y="1" width="8" height="10" rx="1.5" stroke="#1F1B17" strokeWidth="1.2" />
            <rect x="2.5" y="3.5" width="5" height="3.5" rx="0.8" fill="#4F46E5" />
          </svg>
          <span className="text-[7.5px] font-semibold tracking-wide text-[#1F1B17]">via Souvenir</span>
        </div>
      </div>
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
        <div className="relative flex h-9 items-center justify-between bg-[#FAF7F4] px-4 pt-1">
          <span className="text-[9px] font-semibold text-[#1F1B17]">17:34</span>
          <div className="absolute left-1/2 top-2 h-[18px] w-[68px] -translate-x-1/2 rounded-full bg-[#1C1C1E]" />
        </div>
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

function StarIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5">
      <path d="M7 1l1.55 3.14L12 4.64l-2.5 2.43.59 3.43L7 8.77 4.91 10.5l.59-3.43L3 4.64l3.45-.5L7 1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
      <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" />
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
