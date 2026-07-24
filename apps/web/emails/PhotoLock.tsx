import { Img, Link } from "@react-email/components";

/**
 * Vignette floutée + cadenas, pour les emails. Pas de <Section>/<table> ici :
 * l'overlay a besoin de position:absolute, donc un <div> simple — accepté
 * par tous les clients ciblés (Apple Mail, Gmail app/web) sauf Outlook
 * desktop, qui ignore juste le cadenas et garde la photo (repli correct).
 */
export function PhotoLock({
  src,
  href,
  width,
  height,
  radius,
  alt = "",
}: {
  src: string;
  href: string;
  width: number;
  height: number;
  radius: number;
  alt?: string;
}) {
  return (
    <Link href={href} style={{ display: "block", position: "relative", width: "100%", maxWidth: width }}>
      <Img
        src={src}
        width={width}
        height={height}
        alt={alt}
        style={{ display: "block", width: "100%", maxWidth: width, height, objectFit: "cover", borderRadius: radius }}
      />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.35))" }}>
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M7.5 10V7a4.5 4.5 0 0 1 9 0v3" />
        </svg>
      </div>
    </Link>
  );
}
