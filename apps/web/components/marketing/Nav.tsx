import Link from "next/link";
import { SouvenirMark } from "@/components/SouvenirMark";

export function Nav() {
  return (
    <header className="lp-nav">
      <Link href="/" className="lp-nav__brand">
        <SouvenirMark size="sm" />
        <span className="lp-nav__word">Souvenir</span>
      </Link>

      <div className="lp-nav__right">
        <nav className="lp-nav__links">
          <a href="#comment-ca-marche">Fonctionnalités</a>
          <a href="#cas-usage">Cas d&apos;usage</a>
          <a href="#tarifs">Tarifs</a>
          <a href="/login" className="is-muted">Se connecter</a>
        </nav>
        <div className="lp-nav__actions">
          <a href="/signup" className="lp-nav__btn-ghost">Voir une démo</a>
          <a href="/signup" className="lp-nav__btn-dark">Démarrer gratuitement</a>
          <button className="lp-nav__burger" aria-label="Ouvrir le menu">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </header>
  );
}
