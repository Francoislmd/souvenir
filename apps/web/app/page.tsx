import { Nav } from "@/components/marketing/Nav";
import { PhoneMockup } from "@/components/marketing/PhoneMockup";
import { ButtonLink } from "@/components/ui/Button";

export default function Home() {
  return (
    <main className="relative overflow-hidden bg-canvas">
      <div
        className="pointer-events-none absolute -top-48 right-[-15%] h-[34rem] w-[34rem] rounded-full opacity-[0.22] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />
      <div
        className="pointer-events-none absolute left-[-10%] top-[60vh] h-[28rem] w-[28rem] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "var(--brand-gradient)" }}
      />

      <div className="relative z-10 px-4 pt-4 sm:px-6">
        <Nav />
      </div>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-5xl gap-12 px-6 pb-24 pt-12 sm:pt-20 md:grid-cols-2 md:items-center">
        <div className="text-center md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-card">
            📍 Écoles de parapente, canyoning, rafting…
          </span>

          <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Le souvenir
            <br />
            de leur aventure,
            <br />
            <span
              style={{
                backgroundImage: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              dans leur poche.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-base text-ink-2 sm:text-lg md:mx-0">
            Photos et vidéos livrées automatiquement à chaque client, dans une galerie à la couleur de ton école. Zéro
            app, zéro compte — juste un QR code à scanner.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row md:justify-start">
            <ButtonLink href="/signup" size="lg">
              Lancer ma galerie
            </ButtonLink>
            <ButtonLink href="#comment-ca-marche" variant="secondary" size="lg">
              Voir comment ça marche
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto hidden h-[26rem] w-full max-w-sm sm:block">
          <PolaroidCard
            className="absolute -left-2 top-2 -rotate-[12deg]"
            gradient="linear-gradient(135deg, #7DD3FC 0%, #3B82F6 100%)"
            caption="Vol biplace 🪂"
          />
          <PolaroidCard
            className="absolute -right-4 bottom-6 rotate-[10deg]"
            gradient="linear-gradient(135deg, #C4B5FD 0%, #4F46E5 100%)"
            caption="Rivière 🛶"
          />
          <PhoneMockup className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-3deg]" />
        </div>

        {/* Mockup mobile : sans les cartes décoratives, juste le téléphone */}
        <div className="mx-auto flex justify-center sm:hidden">
          <PhoneMockup />
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="comment-ca-marche" className="relative z-10 bg-surface py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center md:text-left">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Comment ça marche</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Trois étapes, deux minutes après l&apos;atterrissage.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <StepCard
              step="1"
              tint="#EEF2FF"
              color="#4F46E5"
              title="Le moniteur scanne"
              description="Il crée la livraison, ajoute les photos et vidéos depuis son téléphone — même en 4G moyenne."
            />
            <StepCard
              step="2"
              tint="#E0F2FE"
              color="#0EA5E9"
              title="Le client scanne"
              description="Sa galerie s'ouvre directement, à la marque de l'école. Zéro app, zéro compte à créer."
            />
            <StepCard
              step="3"
              tint="#F5F3FF"
              color="#7C3AED"
              title="Il craque pour le pack HD"
              description="Paiement intégré, déverrouillage immédiat. 80 % pour l'école, 20 % pour Souvenir."
            />
          </div>
        </div>
      </section>

      {/* Pourquoi Souvenir */}
      <section id="pourquoi-souvenir" className="relative z-10 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="text-center md:text-left">
            <span className="text-sm font-semibold uppercase tracking-wide text-brand">Pourquoi Souvenir</span>
            <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              Pensé pour le terrain, pas pour un bureau.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            <FeatureCard
              icon={<CameraIcon />}
              tint="#EEF2FF"
              color="#4F46E5"
              title="Livraison automatique"
              description="Le moniteur scanne, le client reçoit sa galerie en quelques minutes, même quand le réseau coupe."
            />
            <FeatureCard
              icon={<PaletteIcon />}
              tint="#E0F2FE"
              color="#0EA5E9"
              title="À ta marque"
              description="Logo, couleurs et nom de ton école sur toute la galerie — Souvenir reste discret."
            />
            <FeatureCard
              icon={<CardIcon />}
              tint="#F5F3FF"
              color="#7C3AED"
              title="Pack HD en un clic"
              description="Paiement embarqué dans la galerie, sans redirection. Split automatique 80 % / 20 %."
            />
            <FeatureCard
              icon={<ChartIcon />}
              tint="#F0FDF4"
              color="#16A34A"
              title="Attach rate en direct"
              description="Un dashboard simple pour suivre le taux d'achat et savoir si ton pilote cartonne."
            />
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative z-10 mx-6 mb-6 overflow-hidden rounded-card bg-ink px-6 py-16 text-center sm:mx-auto sm:max-w-5xl sm:px-12">
        <div
          className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full opacity-30 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div className="relative z-10">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-extrabold tracking-tight text-canvas sm:text-4xl">
            Prêts à offrir le souvenir de leur aventure ?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-canvas/70 sm:text-base">
            Onboarding en quelques minutes, Stripe Connect inclus. Lance ta première galerie aujourd&apos;hui.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <ButtonLink href="/signup" size="lg">
              Lancer ma galerie
            </ButtonLink>
            <ButtonLink href="/login" variant="outline-light" size="lg">
              J&apos;ai déjà un compte
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-1 px-6 pb-10 text-center text-xs text-muted">
        <span>© {new Date().getFullYear()} Souvenir</span>
      </footer>
    </main>
  );
}

function PolaroidCard({ className, gradient, caption }: { className: string; gradient: string; caption: string }) {
  return (
    <div className={`w-40 rounded-[10px] bg-[#FFFBF6] p-2.5 shadow-2xl ${className}`}>
      <div className="aspect-[4/3] w-full rounded-[6px]" style={{ background: gradient }} />
      <p className="mt-2 text-center font-display text-sm font-bold text-ink">{caption}</p>
    </div>
  );
}

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
    <div className="rounded-card border border-border bg-canvas p-6 shadow-card">
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

function FeatureCard({
  icon,
  tint,
  color,
  title,
  description,
}: {
  icon: React.ReactNode;
  tint: string;
  color: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-card border border-border bg-surface p-6 shadow-card">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: tint, color }}
      >
        {icon}
      </span>
      <div>
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink-2">{description}</p>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13.5" r="3.25" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PaletteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="M12 21a9 9 0 1 1 9-9c0 1.5-1 2.5-2.5 2.5h-2a2 2 0 0 0-1.5 3.3c.4.5.2 1.4-.5 1.9-.7.5-1.6.7-2.5.3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="10.5" r="1.25" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.25" fill="currentColor" />
      <circle cx="16.5" cy="10.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
      <path d="M7 14.5h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
