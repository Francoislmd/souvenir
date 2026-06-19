import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";

const LINKS = [
  { href: "#comment-ca-marche", label: "Comment ça marche" },
  { href: "/signup", label: "Démarrer" },
];

export function Nav() {
  return (
    <div className="sticky top-4 z-30 mx-auto flex max-w-3xl items-center justify-between gap-2 rounded-full px-4 py-2.5 shadow-card nav-pill sm:px-5">
      <Link href="/">
        <Logo markClassName="h-7 w-7" textClassName="text-base" />
      </Link>

      <nav className="hidden items-center gap-6 sm:flex">
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className="text-sm font-medium text-ink-2 transition hover:text-ink">
            {link.label}
          </a>
        ))}
      </nav>

      <ButtonLink href="/login" variant="secondary" size="sm">
        Me connecter
      </ButtonLink>
    </div>
  );
}
