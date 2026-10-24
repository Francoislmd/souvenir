import s from "@/app/(marketing)/accueil.module.css";

/** Vignette d'aperçu floutée avec le cadenas des galeries (même dessin que components/gallery/PhotoPicker.tsx). */
export function Locked({ src }: { src: string }) {
  return (
    <span className={s.locked} style={{ backgroundImage: `url(${src})` }}>
      <svg viewBox="-56 -56 112 112" aria-hidden="true">
        <circle r="55.5" fill="rgba(0,0,0,0.35)" />
        <g transform="translate(0 2)" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="-17" y="-4" width="34" height="24" rx="5" />
          <path d="M-10-4v-10a10 10 0 0 1 20 0v10" />
        </g>
      </svg>
    </span>
  );
}

export function CheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#191D24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.3l2.7 2.7L16 9.7" />
    </svg>
  );
}
