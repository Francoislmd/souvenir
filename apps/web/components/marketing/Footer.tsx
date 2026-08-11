import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";

const PRODUIT = [
  { href: "/fonctionnement", label: "Fonctionnement" },
  { href: "/simulation", label: "Simuler mes revenus" },
  { href: "/simulation", label: "Tarif" },
  { href: "/liste-attente", label: "Liste d'attente" },
];

function FooterColumn({ title, links }: { title: string; links: typeof PRODUIT }) {
  return (
    <div className="flex flex-col items-start gap-[11px]">
      <h4 className="mb-1 font-display text-[12px] font-bold uppercase tracking-[.12em] text-white/40">{title}</h4>
      {links.map((l) => (
        <Link
          key={l.href + l.label}
          href={l.href}
          className="text-[14.5px] text-white/70 transition [@media(hover:hover)]:hover:text-white"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

const iconProps = {
  viewBox: "0 0 24 24",
  width: 15,
  height: 15,
  fill: "none",
  stroke: "rgba(255,255,255,.7)",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function InstagramIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg {...iconProps} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <path d="M8 10.5v6.2M8 7.4v.1M12 16.7v-3.6a2.2 2.2 0 0 1 4.4 0v3.6" />
    </svg>
  );
}

function Social({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 transition [@media(hover:hover)]:hover:border-white/30 [@media(hover:hover)]:hover:bg-white/10"
    >
      {children}
    </a>
  );
}

export function Footer() {
  return (
    <footer className="relative z-[3] mt-[clamp(40px,6vh,80px)] rounded-t-[clamp(20px,2vw,30px)] bg-ink text-white">
      <div className="mx-auto max-w-[1320px] px-[var(--gutter)] pb-[clamp(20px,3vh,28px)] pt-[clamp(40px,6vh,66px)]">
        <div className="grid grid-cols-1 gap-7 pb-[clamp(28px,4vh,44px)] min-[561px]:grid-cols-2 min-[561px]:gap-8 min-[981px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] min-[981px]:gap-[clamp(24px,3vw,54px)]">
          <div>
            <div className="mb-[14px] flex items-center gap-[9px]">
              <Logo variant="lockup" tone="white" height={26} />
            </div>
            <p className="max-w-[340px] text-[14.5px] leading-[1.55] text-white/60">
              La boutique photo des professionnels de l&apos;outdoor. Chaque sortie devient une source de revenu.
            </p>
            <ButtonLink
              href="/liste-attente"
              variant="sunset"
              size="md"
              className="group mt-5 [@media(hover:hover)]:hover:-translate-y-px"
            >
              Rejoindre la liste d&apos;attente
              <span aria-hidden="true" className="transition-transform [@media(hover:hover)]:group-hover:translate-x-[3px]">
                →
              </span>
            </ButtonLink>
            <div className="mt-[22px] flex items-center gap-2 text-[12.5px] text-white/45">
              <span className="text-[14px] leading-none">🇪🇺</span>
              Données hébergées en Europe · Conforme RGPD
            </div>
          </div>

          <FooterColumn title="Produit" links={PRODUIT} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-[18px] border-t border-white/10 pt-[clamp(16px,2.4vh,22px)] text-[12.5px] text-white/40 min-[561px]:justify-between">
          <span className="flex flex-wrap items-center gap-x-[10px] gap-y-1">
            <span>© {new Date().getFullYear()} Linktrip · Fait en France</span>
            <ManageCookiesLink className="underline underline-offset-2 transition hover:text-white/70" />
          </span>
          <div className="flex gap-[10px]">
            <Social href="https://instagram.com/linktrip.co" label="Instagram">
              <InstagramIcon />
            </Social>
            <Social href="https://linkedin.com/company/linktrip" label="LinkedIn">
              <LinkedinIcon />
            </Social>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
