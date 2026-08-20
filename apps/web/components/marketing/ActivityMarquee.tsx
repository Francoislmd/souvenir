import type { CSSProperties } from "react";
import { ACTIVITY_ICONS, type ActivitySlug } from "@/components/marketing/ActivityIcons";
import styles from "./ActivityMarquee.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/* Section "types d'activités" — reprend les codes visuels d'une bande de logos
   clients SaaS (monochrome, fondu latéral, beaucoup de blanc) pour présenter des
   CATÉGORIES DE PRESTATIONS COMPATIBLES. Linktrip n'ayant pas encore de clients à
   afficher, le wording doit rester strictement dans le registre de la CAPACITÉ
   ("conçu pour", "compatible avec") et jamais de la possession ("ils nous font
   confiance", "utilisé par", "+200 opérateurs").

   Server Component : l'animation est 100 % CSS, il n'y a rien à hydrater. */

export type Activity = {
  slug: ActivitySlug;
  /** Label court obligatoire : le bandeau ne gère pas les retours à la ligne. */
  label: string;
};

/* Ordre volontaire : on alterne eau / terre / air pour que la diversité des
   univers se perçoive en un seul passage. 12 entrées ≈ 2 400 px, soit largement
   plus qu'un viewport — condition nécessaire pour une boucle sans trou.
   Sous 10 entrées, passer REPEAT à 3 ici ET le translate3d à -33.333% dans le CSS. */
export const MARQUEE_ACTIVITIES: Activity[] = [
  { slug: "rafting", label: "Rafting" },
  { slug: "canyoning", label: "Canyoning" },
  { slug: "kayak", label: "Kayak" },
  { slug: "jet-ski", label: "Jet ski" },
  { slug: "paddle", label: "Paddle" },
  { slug: "surf", label: "Surf" },
  { slug: "tyrolienne", label: "Tyrolienne" },
  { slug: "quad", label: "Quad" },
  { slug: "parapente", label: "Parapente" },
  { slug: "plongee", label: "Plongée" },
  { slug: "parc-aventure", label: "Parc aventure" },
  { slug: "helicoptere", label: "Hélicoptère" },
];

/** Nombre de copies de la liste dans la piste. À garder synchronisé avec le keyframe CSS. */
const REPEAT = 2;

interface ActivityMarqueeProps {
  eyebrow?: string;
  title?: string;
  activities?: Activity[];
  /** Durée d'un cycle. ~3,8 s par activité pour garder la même vitesse perçue. */
  durationSec?: number;
  /**
   * À activer uniquement si la section est montée DANS un conteneur à gouttières
   * (`.rail` de landing.module.css) : le bandeau ressort alors des gouttières pour
   * toucher les bords de l'écran. Monté en frère de `.rail`, laisser à false —
   * il est déjà pleine largeur et le débord créerait un défilement horizontal.
   */
  bleed?: boolean;
  className?: string;
}

function ActivityRow({ activities, ghost }: { activities: Activity[]; ghost: boolean }) {
  return (
    <ul className={cx(styles.row, "flex shrink-0 items-center")} aria-hidden={ghost || undefined}>
      {activities.map(({ slug, label }) => {
        const Icon = ACTIVITY_ICONS[slug];
        return (
          <li key={slug} className="flex shrink-0 items-center">
            <span className="flex shrink-0 items-center gap-[11px] px-7 text-ink-4 transition-colors duration-300 [@media(hover:hover)]:hover:text-ink-2">
              <Icon width={26} height={26} />
              <span className="whitespace-nowrap text-[15px] font-semibold tracking-[-0.012em]">
                {label}
              </span>
            </span>
            <span aria-hidden="true" className={cx(styles.dot, "h-[3px] w-[3px] shrink-0 rounded-full bg-line")} />
          </li>
        );
      })}
    </ul>
  );
}

export function ActivityMarquee({
  eyebrow = "Conçu pour tous les métiers de l'aventure",
  title = "Une boutique photo pensée pour chaque type d'activité outdoor",
  activities = MARQUEE_ACTIVITIES,
  durationSec = 46,
  bleed = false,
  className,
}: ActivityMarqueeProps) {
  return (
    <section
      aria-labelledby="activites-compatibles"
      className={cx("py-[clamp(56px,7vh,96px)]", className)}
    >
      {/* Les blocs de texte portent la gouttière ; le bandeau, lui, va d'un bord
          à l'autre de la section — c'est ce contraste qui produit l'effet "bande". */}
      <div className="mx-auto max-w-[720px] px-[var(--gutter,20px)] text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[.12em] text-ink-3">{eyebrow}</p>
        <h2
          id="activites-compatibles"
          className="mx-auto mt-3 max-w-[22ch] font-display text-[clamp(24px,1.6vw+0.8vh,32px)] font-bold leading-[1.18] tracking-[-0.03em] text-ink"
        >
          {title}
        </h2>
      </div>

      <div
        className={cx(styles.viewport, bleed && styles.bleed, "mt-[clamp(32px,4.4vh,56px)]")}
        style={{ "--marquee-duration": `${durationSec}s` } as CSSProperties}
      >
        <div className={styles.track}>
          {Array.from({ length: REPEAT }, (_, i) => (
            <ActivityRow key={i} activities={activities} ghost={i > 0} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ActivityMarquee;
