import Image from "next/image";
import { Nav } from "@/components/marketing/Nav";
import { ButtonLink } from "@/components/ui/Button";
import { HeroForm } from "@/components/marketing/HeroForm";
import { RevenueSimulator } from "@/components/marketing/RevenueSimulator";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Logo } from "@/components/brand/Logo";
import { FaqList } from "@/components/marketing/FaqList";
import { DistributionAnimation } from "@/components/marketing/DistributionAnimation";
import { UploadAnimation } from "@/components/marketing/UploadAnimation";
import { GalleryPhoneAnimated } from "@/components/marketing/GalleryPhoneAnimated";

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
      <section className="relative z-10 mx-auto grid max-w-5xl gap-10 px-6 pb-16 pt-12 sm:pt-24 md:grid-cols-2 md:items-center md:gap-16 md:pb-32">
        <div className="text-center md:text-left">
          <span className="hero-enter inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card" style={{ animationDelay: "0ms" }}>
            Pour les guides, moniteurs et écoles outdoor
          </span>

          <h1 className="hero-enter mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-[56px]" style={{ animationDelay: "80ms" }}>
            Transformez vos photos
            <br />
            <span
              style={{
                backgroundImage: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              en revenus automatiques.
            </span>
          </h1>

          <p className="hero-enter mx-auto mt-6 max-w-md text-base leading-relaxed text-ink-2 sm:text-lg md:mx-0" style={{ animationDelay: "160ms" }}>
            Guide, moniteur ou école outdoor : les photos que vous capturez après chaque session peuvent devenir une source de revenus automatique.{" "}
            <strong className="font-semibold text-ink">Souvenir les envoie à vos clients. Ils débloquent, vous encaissez. Zéro gestion.</strong>
          </p>

          <HeroForm />
          <p className="mt-5 text-xs text-muted">
            Parapente · Canyoning · Rafting · Surf · Kayak · Escalade · Ski · Nautique
          </p>
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
            <GalleryPhoneAnimated />
          </div>

          {/* Badge revenus */}
          <div className="animate-float absolute bottom-[2%] left-[4%] z-20">
            <FloatingBadge
              className="-rotate-[1deg]"
              icon={<EuroIcon />}
              iconBg="#DCFCE7"
              iconColor="#16A34A"
              label="1 240 € encaissés"
            />
          </div>
          {/* Badge Instagram */}
          <div className="animate-float-alt absolute top-[3%] right-[4%] z-20">
            <FloatingBadge
              className="rotate-[2deg]"
              icon={<InstagramIcon />}
              iconBg="linear-gradient(135deg,#F9CE34,#EE2A7B,#6228D7)"
              iconColor="#fff"
              label="@volpassionannecy"
            />
          </div>
        </div>

        {/* Visual — mobile */}
        <div className="flex justify-center md:hidden">
          <GalleryPhone />
        </div>
      </section>

      {/* ─── Comment ça marche — 4 étapes ─── */}
      <section id="comment-ca-marche" className="relative z-10 bg-surface py-14 md:py-36">
        <div className="mx-auto max-w-5xl px-6">
          <div className="reveal mb-12 text-center md:mb-20">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Comment ça marche</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Vous prenez les photos.<br />Nous faisons le reste.
            </h2>
          </div>

          <div className="space-y-14 md:space-y-28">

            {/* Étape 1 — Upload · texte gauche, illustration droite */}
            <div className="reveal grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-20">
              {/* Texte */}
              <div>
                <span className="font-display text-5xl font-extrabold text-border md:text-6xl">01</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Importez vos médias</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Déposez vos photos et vidéos en quelques secondes depuis votre pellicule. Les transferts reprennent automatiquement en cas de coupure réseau.
                </p>
              </div>
              {/* Illustration animée */}
              <UploadAnimation />
            </div>

            {/* Étape 2 — Répartition · illustration gauche, texte droite */}
            <div className="reveal grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-20">
              {/* Illustration animée */}
              <DistributionAnimation />
              {/* Texte */}
              <div>
                <span className="font-display text-5xl font-extrabold text-border md:text-6xl">02</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Nous livrons automatiquement</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Attribuez chaque photo à la bonne personne en quelques secondes. Vos clients reçoivent un lien personnalisé par email et SMS — sans rien faire de plus.
                </p>
              </div>
            </div>

            {/* Étape 3 — Galerie & achat · texte gauche, illustration droite */}
            <div className="reveal grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-20">
              {/* Texte */}
              <div>
                <span className="font-display text-5xl font-extrabold text-border md:text-6xl">03</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Vous êtes payé</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Ils débloquent leurs souvenirs directement depuis leur téléphone. Les paiements sont automatisés — Stripe encaisse et transfère votre part sans action de votre part.
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
            <div className="reveal grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-20">
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
                <span className="font-display text-5xl font-extrabold text-border md:text-6xl">04</span>
                <h3 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">Pendant ce temps, vous êtes sur votre prochaine activité</h3>
                <p className="mt-4 text-base leading-relaxed text-ink-2">
                  Taux d&apos;achat, CA encaissé, avis collectés : votre dashboard se met à jour en temps réel. Rien à configurer, rien à suivre.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Tarifs ─── */}
      <section id="tarifs" className="relative z-10 overflow-hidden bg-ink py-14 md:py-28">
        <div
          className="pointer-events-none absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full opacity-[0.10] blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative mx-auto max-w-5xl px-6">

          <div className="reveal text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-brand">Tarifs</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Souvenir ne gagne<br />que quand vous gagnez
            </h2>
            <p className="mt-4 text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
              0&nbsp;€ fixe · Aucun abonnement · Commission uniquement sur les ventes
            </p>
          </div>

          {/* Features partagées */}
          {(() => {
            const features = [
              "Upload et répartition des photos & vidéos par client",
              "Envoi automatique des galeries par email et SMS",
              "Relances automatiques par mail et SMS",
              "Paiement intégré et versement automatique",
              "Suivi en temps réel sur le dashboard",
            ];
            const check = (color: string) => (
              <svg viewBox="0 0 14 14" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 7l3.5 3.5 6.5-6.5" />
              </svg>
            );
            return (
              <div className="mt-10 grid gap-5 md:mt-14 md:grid-cols-2">

                {/* Mode Marketing */}
                <div
                  className="reveal rounded-card p-6 md:p-8"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Mode</p>
                      <h3 className="mt-1 font-display text-2xl font-extrabold text-white">Marketing</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-[#14532D]/60 px-3 py-1 text-xs font-bold text-[#4ADE80]">Gratuit</span>
                  </div>
                  <div className="mt-6 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-end gap-2">
                      <span className="font-display text-5xl font-extrabold text-white">0</span>
                      <span className="mb-1.5 font-display text-2xl font-bold text-white">%</span>
                      <span className="mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>de commission</span>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Photos offertes au client — la valeur est dans la visibilité et les avis
                    </p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {check("#4ADE80")}
                        {f}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mode Boutique */}
                <div
                  className="reveal reveal-d1 relative rounded-card p-6 md:p-8"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(79,70,229,0.6)" }}
                >
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1.5 text-[11px] font-bold text-white"
                    style={{ background: "var(--brand)" }}
                  >
                    Recommandé
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>Mode</p>
                      <h3 className="mt-1 font-display text-2xl font-extrabold text-white">Boutique</h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand/20 px-3 py-1 text-xs font-bold text-brand">+&nbsp;revenus</span>
                  </div>
                  <div className="mt-6 border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <div className="flex items-end gap-2">
                      <span className="font-display text-5xl font-extrabold text-white">20</span>
                      <span className="mb-1.5 font-display text-2xl font-bold text-white">%</span>
                      <span className="mb-1.5 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>par vente</span>
                    </div>
                    <p className="mt-1.5 text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      Frais Stripe inclus · rien à débourser à l&apos;avance
                    </p>
                  </div>
                  <div className="mt-6 space-y-3">
                    {features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {check("var(--brand)")}
                        {f}
                      </div>
                    ))}
                  </div>
                  <div className="mt-8">
                    <ButtonLink href="/signup" size="lg" className="w-full justify-center">
                      Démarrer gratuitement
                    </ButtonLink>
                  </div>
                </div>

              </div>
            );
          })()}

          <p className="mt-8 text-center text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            Les deux modes sont disponibles sur le même compte — vous choisissez session par session.
          </p>

        </div>
      </section>

      {/* ─── Simulateur de revenus ─── */}
      <section className="relative z-10 bg-canvas py-14 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="reveal grid grid-cols-1 items-center gap-10 md:grid-cols-[5fr_7fr] md:gap-16">

            {/* Vidéo portrait — masquée sur mobile */}
            <div
              className="relative hidden aspect-[9/16] overflow-hidden rounded-card md:block"
              style={{ boxShadow: "0 32px 64px -16px rgba(0,0,0,0.22), 0 8px 24px -6px rgba(0,0,0,0.12)" }}
            >
              <video
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
              >
                <source src="/hero-paragliding.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Simulateur */}
            <RevenueSimulator />

          </div>
        </div>
      </section>

      {/* ─── Bénéfices ─── */}
      <section className="relative z-10 bg-canvas py-14 md:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">

            {/* Mosaïque 2×2 */}
            <div className="reveal grid grid-cols-2 gap-2.5">
              {[
                "/hero-paragliding.jpg",
                "/hero-surf.jpg",
                "/hero-canyoning.jpg",
                "/hero-rafting.jpg",
              ].map((src) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-[16px]">
                  <Image src={src} fill className="object-cover" alt="" sizes="(max-width: 768px) 45vw, 22vw" />
                </div>
              ))}
            </div>

            {/* Liste des avantages */}
            <div className="reveal reveal-d1">
              <span className="text-sm font-semibold uppercase tracking-wide text-brand">Conçu pour les pros de l&apos;outdoor</span>
              <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Une nouvelle source de revenus, sans travail supplémentaire
              </h2>

              <div className="mt-6 divide-y divide-border md:mt-10">
                {[
                  {
                    iconBg: "#EAF7EE",
                    iconColor: "#16A34A",
                    icon: (
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M2 14l3.5-3.5 3 3L14 7l4 4" />
                        <path d="M14 7h4v4" />
                      </svg>
                    ),
                    title: "Augmentez vos revenus",
                    desc: "Générez des ventes après chaque activité. Stripe encaisse et verse votre part automatiquement — chaque sortie devient une opportunité.",
                  },
                  {
                    iconBg: "#EEF2FF",
                    iconColor: "#4F46E5",
                    icon: (
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 2L4 11h5.5l-1 7L17 9h-5.5L11 2z" />
                      </svg>
                    ),
                    title: "Gagnez du temps",
                    desc: "Fini les échanges WhatsApp, WeTransfer et les relances manuelles. Import groupé, tri par client, envoi automatique — en quelques secondes sur le terrain.",
                  },
                  {
                    iconBg: "#FEF6EC",
                    iconColor: "#D97706",
                    icon: (
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="4" cy="10" r="1.75" />
                        <circle cx="16" cy="4" r="1.75" />
                        <circle cx="16" cy="16" r="1.75" />
                        <path d="M5.75 9.1L14.25 5M5.75 10.9l8.5 4.1" />
                      </svg>
                    ),
                    title: "Développez votre visibilité",
                    desc: "Chaque souvenir partagé fait découvrir votre activité à de nouveaux clients. Avis Google, partages Instagram — sans budget pub.",
                  },
                  {
                    iconBg: "#F1F5F9",
                    iconColor: "#475569",
                    icon: (
                      <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 2L3 5.5v5C3 14.1 6 17.5 10 18.5c4-1 7-4.4 7-8V5.5L10 2z" />
                        <path d="M7 10l2 2 4-4" />
                      </svg>
                    ),
                    title: "Collectez plus d'avis",
                    desc: "Transformez l'enthousiasme de vos clients en avis positifs. Les relances partent automatiquement au bon moment, vous n'y pensez plus.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4 py-6">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]"
                      style={{ background: item.iconBg, color: item.iconColor }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-2">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="faq" className="relative z-10 bg-surface py-14 md:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <div className="reveal mb-10 text-center md:mb-14">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">FAQ</span>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Questions fréquentes
            </h2>
          </div>
          <FaqList />
        </div>
      </section>

      {/* ─── CTA band ─── */}
      <section className="reveal relative z-10 mx-4 mb-4 overflow-hidden rounded-card bg-ink px-6 py-12 text-center sm:mx-6 sm:mb-6 sm:px-12 md:py-16">
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full opacity-25 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative z-10">
          <h2 className="mx-auto max-w-2xl font-display text-2xl font-extrabold tracking-tight text-canvas sm:text-3xl md:text-4xl">
            Commencez gratuitement.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-canvas/70 sm:text-base">
            Créez votre espace en quelques minutes et découvrez combien vos souvenirs peuvent vous rapporter.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">
              Créer mon espace gratuitement
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-light" size="lg">
              J&apos;ai déjà un compte
            </ButtonLink>
          </div>
        </div>
      </section>

      <ScrollReveal />

      <footer className="relative z-10 border-t border-border bg-canvas">
        <div className="mx-auto max-w-5xl px-6 py-10 md:py-14">

          {/* Top row */}
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">

            {/* Brand column */}
            <div className="max-w-xs">
              <Logo markClassName="h-7 w-7" textClassName="text-base" />
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                Outil marketing pour opérateurs d&apos;activités outdoor — photos et vidéos livrées automatiquement après chaque session.
              </p>
              {/* Social */}
              <div className="mt-5 flex items-center gap-3">
                <a
                  href="https://instagram.com/souvenir.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface text-ink-2 transition-colors hover:border-brand hover:text-brand"
                  aria-label="Instagram"
                >
                  <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                    <rect x="2" y="2" width="12" height="12" rx="3.5" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="8" cy="8" r="2.8" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="11.5" cy="4.5" r="0.8" fill="currentColor" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Produit</p>
                <ul className="space-y-3 text-sm text-ink-2">
                  <li><a href="#comment-ca-marche" className="transition-colors hover:text-ink">Comment ça marche</a></li>
                  <li><a href="#tarifs" className="transition-colors hover:text-ink">Tarifs</a></li>
                  <li><a href="/signup" className="transition-colors hover:text-ink">Démarrer gratuitement</a></li>
                  <li><a href="/login" className="transition-colors hover:text-ink">Se connecter</a></li>
                </ul>
              </div>

              <div>
                <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted">Légal</p>
                <ul className="space-y-3 text-sm text-ink-2">
                  <li><a href="/confidentialite" className="transition-colors hover:text-ink">Confidentialité</a></li>
                  <li><a href="/mentions-legales" className="transition-colors hover:text-ink">Mentions légales</a></li>
                  <li><a href="/cgu" className="transition-colors hover:text-ink">CGU</a></li>
                </ul>
              </div>

            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-8 sm:flex-row">
            <p className="text-xs text-muted">
              © {new Date().getFullYear()} Souvenir. Tous droits réservés.
            </p>
            <p className="text-xs text-muted">
              Fait avec ❤️ depuis Annecy, France.
            </p>
          </div>

        </div>
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


/* ─── Dashboard Preview ─── */

/* ─── Icons ─── */
function EuroIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
      <path d="M11 4.5a4 4 0 1 0 0 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 7h6M3 9h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

