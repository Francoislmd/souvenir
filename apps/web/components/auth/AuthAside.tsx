import Link from "next/link";
import s from "./aside.module.css";

/*
 * Le panneau de droite des écrans de connexion et d'inscription (à la
 * Payfit, 25/10/2026) : sur fond pêche, la galerie qu'un client reçoit,
 * la vente qui tombe, puis un titre, une phrase et un lien. Masqué sous
 * 960 px : sur téléphone, le formulaire suffit.
 */
const COPY = {
  connexion: {
    title: "Vos ventes tombent pendant que vous encadrez",
    text: "Chaque client reçoit sa galerie privée et paie les photos qu’il garde.",
    cta: "Découvrir Linktrip",
    href: "/",
  },
  signup: {
    title: "Une galerie privée pour chaque client",
    text: "Déposez les photos de la sortie : chaque client reçoit son lien et paie depuis son téléphone.",
    cta: "Voir la démo",
    href: "/produit#demo",
  },
} as const;

function Lock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function Tick() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const PHOTOS: [string, boolean][] = [
  ["/landing-payfit/r-1.webp", true],
  ["/landing-payfit/r-3.webp", false],
  ["/landing-payfit/r-5.webp", true],
  ["/landing-payfit/r-2.webp", false],
];

export function AuthAside({ variant }: { variant: keyof typeof COPY }) {
  const c = COPY[variant];
  return (
    <aside className={s.aside}>
      <div className={s.stage} aria-hidden="true">
        <div className={s.card}>
          <div className={s.cardHead}>
            <strong>Votre sortie Rafting</strong>
            <span>Samedi · Gorges du Verdon</span>
          </div>
          <div className={s.grid}>
            {PHOTOS.map(([src, picked]) => (
              <span key={src} className={`${s.ph} ${picked ? s.picked : s.locked}`}>
                <span style={{ backgroundImage: `url(${src})` }} />
                {picked ? (
                  <i className={s.tick}>
                    <Tick />
                  </i>
                ) : (
                  <i className={s.lock}>
                    <Lock />
                  </i>
                )}
              </span>
            ))}
          </div>
          <div className={s.total}>
            <span>2 photos</span>
            <strong>12,00 €</strong>
          </div>
          <span className={s.pay}>Payer</span>
        </div>
        <div className={s.pill}>
          <span className={s.dot} />
          Paiement reçu
          <b>+ 12,00 €</b>
        </div>
      </div>
      <h2 className={s.title}>{c.title}</h2>
      <p className={s.text}>{c.text}</p>
      <Link href={c.href} className={s.cta}>
        {c.cta}
      </Link>
    </aside>
  );
}

/** Le formulaire à gauche, le panneau à droite (une colonne sous 960 px). */
export function AuthSplit({ variant, children }: { variant: keyof typeof COPY; children: React.ReactNode }) {
  return (
    <div className={s.split}>
      {children}
      <AuthAside variant={variant} />
    </div>
  );
}
