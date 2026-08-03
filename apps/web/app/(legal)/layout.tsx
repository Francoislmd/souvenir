import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const LEGAL_LINKS = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/cgv", label: "CGV" },
  { href: "/confidentialite", label: "Confidentialité" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-5">
          <Link href="/" aria-label="Retour à l'accueil Linktrip">
            <Logo height={28} />
          </Link>
          <Link href="/" className="text-sm text-ink-2 underline underline-offset-2 hover:text-ink">
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <article className="prose-legal text-ink-2 [&_h1]:font-display [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:text-ink [&_h1]:tracking-tight [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1 [&_li]:leading-relaxed [&_a]:text-brand [&_a]:underline [&_strong]:text-ink">
          {children}
        </article>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-2xl flex-wrap gap-x-6 gap-y-2 px-5 py-8 text-sm text-muted">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-ink-2">
              {link.label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
