import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import styles from "@/app/(marketing)/landing.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

export type MarketingRoute = "fonctionnement" | "simulation" | "liste-attente";

interface HeaderProps {
  /** Route affichée en gras ; absent sur l'accueil (le logo fait office de lien racine). */
  current?: MarketingRoute;
}

export function Header({ current }: HeaderProps) {
  return (
    <header className={styles.header}>
      <Link href="/" aria-label="Linktrip — accueil" className="flex items-center">
        <Logo variant="lockup" height={30} />
      </Link>
      <nav className={styles.headerLinks}>
        <Link
          href="/fonctionnement"
          className={cx("text-[15.5px] text-ink-2 hover:text-ink transition", current === "fonctionnement" && "font-semibold text-ink")}
        >
          Fonctionnement
        </Link>
        <Link
          href="/simulation"
          className={cx("text-[15.5px] text-ink-2 hover:text-ink transition", current === "simulation" && "font-semibold text-ink")}
        >
          Simulation
        </Link>
        <ButtonLink
          href="/liste-attente"
          variant="sunset"
          size="md"
          className={cx(styles.headerCta, "max-[420px]:h-9 max-[420px]:px-3 max-[420px]:text-xs")}
        >
          <span className="max-[380px]:hidden">Rejoindre la liste d&apos;attente</span>
          <span className="hidden max-[380px]:inline">Liste d&apos;attente</span>{" "}
          <span aria-hidden="true">→</span>
        </ButtonLink>
      </nav>
    </header>
  );
}

export default Header;
