import type { ComponentType, ReactNode, SVGProps } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";
import { EmailCaptureField } from "@/components/marketing/EmailCaptureField";
import { ACTIVITY_ICONS } from "@/components/marketing/ActivityIcons";
import styles from "@/components/marketing/Footer.module.css";

/* Le footer porte trois choses en plus de la navigation : la dernière chance de
   conversion (bandeau e-mail, même composant que le hero), les mentions
   légales obligatoires, et le maillage interne vers les pages activités. */

const PRODUIT = [
  // /produit a absorbé /fonctionnement (la démo) et /simulation (le
  // simulateur) : deux entrées de moins, ancres directes vers les sections.
  { href: "/produit", label: "Le produit" },
  { href: "/produit#demo", label: "Voir la démo" },
  { href: "/produit#simulateur", label: "Simuler mes revenus" },
  { href: "/liste-attente", label: "Liste d'attente" },
  { href: "/connexion", label: "Connexion opérateur" },
];

const RESSOURCES = [
  { href: "/#faq", label: "Questions fréquentes" },
  { href: "mailto:hello@linktrip.co", label: "Nous écrire" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/cgv", label: "CGV" },
  { href: "/confidentialite", label: "Confidentialité" },
];

const ACTIVITES: { slug: keyof typeof ACTIVITY_ICONS; label: string }[] = [
  { slug: "surf", label: "Surf" },
  { slug: "parapente", label: "Parapente" },
  { slug: "canyoning", label: "Canyoning" },
  { slug: "rafting", label: "Rafting" },
  { slug: "plongee", label: "Plongée" },
  { slug: "parc-aventure", label: "Parc aventure" },
];

const LINK = "text-[14.5px] text-white/70 transition [@media(hover:hover)]:hover:text-white";

function FooterColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="mb-[15px] font-display text-[12px] font-bold uppercase tracking-[.12em] text-white/40">{title}</h4>
      <div className="flex flex-col items-start gap-[11px]">{children}</div>
    </div>
  );
}

function ShieldIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M12 2.8 4.8 5.6v6.1c0 4.4 3 8 7.2 9.5 4.2-1.5 7.2-5.1 7.2-9.5V5.6L12 2.8Z" />
      <path d="m8.9 12.1 2.1 2.1 4.1-4.2" />
    </svg>
  );
}

function Trust({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 text-[12.5px] text-white/45 ${className ?? ""}`}>
      <ShieldIcon className="h-[15px] w-[15px] flex-none" />
      {children}
    </div>
  );
}

const socialIconProps: SVGProps<SVGSVGElement> = {
  viewBox: "0 0 24 24",
  width: 15,
  height: 15,
  fill: "none",
  stroke: "rgba(255,255,255,.7)",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

function InstagramIcon() {
  return (
    <svg {...socialIconProps}>
      <rect x="3" y="3" width="18" height="18" rx="5.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg {...socialIconProps}>
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
    <footer className="relative z-[3] mt-[clamp(40px,6vh,80px)] overflow-hidden rounded-t-[clamp(20px,2vw,30px)] bg-ink text-white">
      <div className={styles.mark} aria-hidden="true">
        <Logo variant="symbol" tone="white" height={290} title={null} />
      </div>

      <div className="relative mx-auto max-w-[1320px] px-[var(--gutter)] pb-[clamp(20px,3vh,28px)] pt-[clamp(40px,6vh,66px)]">
        {/* Bandeau de conversion : le même champ que le hero, source "footer". */}
        <div className="flex flex-wrap items-center justify-between gap-[22px] border-b border-white/10 pb-[clamp(30px,4.4vh,46px)]">
          <div>
            <h3 className="max-w-[15ch] text-[clamp(23px,2.7vw,36px)] font-bold leading-[1.1] tracking-[-.022em]">
              La boutique photo des professionnels de l&apos;outdoor.
            </h3>
            <p className="mt-[10px] text-[14.5px] text-white/55">
              Chaque sortie devient une source de revenu.
            </p>
          </div>
          <div className="flex max-w-[560px] flex-[1_1_420px] flex-col items-stretch gap-3">
            <EmailCaptureField
              source="footer"
              idPrefix="footer"
              event="footer_email_submit"
              formClassName={styles.field}
              buttonClassName={styles.submit}
              submitLabel="Rejoindre"
            />
            <Trust>Sans engagement, 2 minutes</Trust>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 py-[clamp(30px,4.4vh,46px)] min-[561px]:grid-cols-2 min-[561px]:gap-[34px_30px] min-[1000px]:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))] min-[1000px]:gap-[clamp(24px,3vw,48px)]">
          <div>
            <Link href="/" aria-label="Linktrip — accueil" className="mb-[15px] inline-flex items-center">
              <Logo variant="lockup" tone="white" height={26} title={null} />
            </Link>
            <Trust className="mt-4">Hébergé en Europe, conforme RGPD</Trust>
          </div>

          <FooterColumn title="Produit">
            {PRODUIT.map((l) => (
              <Link key={l.href + l.label} href={l.href} className={LINK}>
                {l.label}
              </Link>
            ))}
          </FooterColumn>

          <FooterColumn title="Activités">
            {ACTIVITES.map(({ slug, label }) => {
              const Icon = ACTIVITY_ICONS[slug] as ComponentType<SVGProps<SVGSVGElement>>;
              return (
                <Link key={slug} href={`/activites/${slug}`} className={`group flex items-center gap-[9px] ${LINK}`}>
                  <Icon className="h-4 w-4 flex-none text-white/40 transition [@media(hover:hover)]:group-hover:text-amber" />
                  {label}
                </Link>
              );
            })}
          </FooterColumn>

          <FooterColumn title="Ressources">
            {RESSOURCES.map((l) =>
              l.href.startsWith("mailto:") ? (
                <a key={l.href} href={l.href} className={LINK}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className={LINK}>
                  {l.label}
                </Link>
              ),
            )}
            <ManageCookiesLink className={LINK} />
          </FooterColumn>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-[14px_18px] border-t border-white/10 pt-[clamp(16px,2.4vh,22px)] text-[12.5px] text-white/40 min-[561px]:justify-between">
          <span>© {new Date().getFullYear()} Linktrip · Fait en France</span>
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
