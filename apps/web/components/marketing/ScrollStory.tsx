"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import styles from "./ScrollStory.module.css";

interface Photo {
  /** Fichier dans public/landing/immersive, sans extension. Toutes en 900x1200 (3:4). */
  src: string;
  alt: string;
  /** Nom d'activité incrusté en bas de la photo. */
  label: string;
  /** Couloir d'ascension, en vw depuis le centre. |lane| >= 29.5 laisse le corridor central libre. */
  lane: number;
  /** Dérive latérale pendant la montée, en vw : casse l'effet « colonnes ». */
  drift: number;
  /** Rotation de départ → d'arrivée, en degrés. */
  rot: [number, number];
}

// Ordre = ordre d'entrée à l'écran. Les activités alternent (jamais deux fois la
// même de suite) et les couloirs alternent gauche/droite, pour que la montée
// reste équilibrée de part et d'autre du CTA.
const PHOTOS: Photo[] = [
  { src: "escalade-falaise",   alt: "Grimpeuse en tête sur une falaise calcaire",              label: "Escalade",   lane: -30.5, drift:  3, rot: [-3.5, -1.0] },
  { src: "parapente-automne",  alt: "Vol biplace en parapente au-dessus d'une forêt d'automne", label: "Parapente",  lane:  34.0, drift: -4, rot: [ 3.0,  1.0] },
  { src: "rafting-eaux-vives", alt: "Équipage de rafting en eaux vives",                        label: "Rafting",    lane: -35.0, drift: -3, rot: [ 2.0, -1.5] },
  { src: "canyoning-rappel",   alt: "Descente en rappel dans un canyon de grès",                label: "Canyoning",  lane:  30.0, drift:  3, rot: [-2.5,  0.5] },
  { src: "balancoire-vallee",  alt: "Balançoire géante face à une vallée de montagne",          label: "Balançoire", lane: -33.0, drift:  4, rot: [ 2.5, -0.5] },
  { src: "escalade-groupe",    alt: "Deux grimpeuses au pied d'une voie",                       label: "Escalade",   lane:  36.0, drift: -3, rot: [-2.0,  1.5] },
  { src: "snorkeling-surface", alt: "Palmes-masque-tuba juste sous la surface",                 label: "Snorkeling", lane: -29.5, drift: -3, rot: [ 3.5,  0.5] },
  { src: "canyoning-cascade",  alt: "Canyoniste sous une cascade en combinaison",               label: "Canyoning",  lane:  32.5, drift:  3, rot: [-3.0, -0.5] },
  { src: "tyrolienne-foret",   alt: "Tyrolienne entre les séquoias",                            label: "Tyrolienne", lane: -36.0, drift:  3, rot: [ 1.5, -2.0] },
  { src: "pont-singe",         alt: "Groupe sur un pont de singe en forêt tropicale",           label: "Parcours",   lane:  30.5, drift: -4, rot: [ 2.5, -1.0] },
  { src: "escalade-ciel",      alt: "Grimpeuse en dévers, ciel nuageux en fond",                label: "Escalade",   lane: -31.5, drift:  3, rot: [-3.0, -1.0] },
  { src: "balancoire-lac",     alt: "Balançoire fleurie suspendue au-dessus d'un lac",          label: "Balançoire", lane:  35.0, drift: -3, rot: [ 3.0,  0.5] },
  { src: "escalade-foret",     alt: "Grimpeuse assurée sur une paroi bordée de forêt",          label: "Escalade",   lane: -34.0, drift: -3, rot: [ 2.0, -1.5] },
  { src: "parapente-biplace",  alt: "Décollage en parapente biplace, voile rouge et blanche",   label: "Parapente",  lane:  29.5, drift:  3, rot: [-2.5,  0.5] },
  { src: "snorkeling-recif",   alt: "Nage au-dessus d'un récif corallien poissonneux",          label: "Snorkeling", lane: -30.0, drift:  4, rot: [ 2.5, -0.5] },
  { src: "canyoning-torrent",  alt: "Rappel dans un torrent en pleine lumière",                 label: "Canyoning",  lane:  33.5, drift: -3, rot: [-2.0,  1.5] },
  { src: "balancoire-depart",  alt: "Départ d'une balançoire géante avec le moniteur",          label: "Balançoire", lane: -35.5, drift: -3, rot: [ 3.5,  0.5] },
  { src: "escalade-duo",       alt: "Deux grimpeuses casquées avant le départ",                 label: "Escalade",   lane:  31.5, drift: -4, rot: [ 2.0, -1.0] },
];

/** Départ de la première photo — négatif : elle est déjà engagée quand la section se cale. */
const FIRST_START = -0.16;
/** Part de sa course que la dernière photo a parcourue quand la section se libère.
    < 1 volontairement : si toutes les photos sortaient avant la fin, le dernier
    tiers de la section serait un écran blanc qu'il faut scroller pour rien. Là,
    les deux dernières sont encore en vol au moment du relâchement et s'en vont
    naturellement avec la page. */
const LAST_TRAVEL_AT_END = 0.72;
/** Le CTA est posé avant les photos : il est l'ancre, pas la chute. */
const CTA_END = 0.1;
/** Amplitude du parallaxe à la souris, en px. Uniforme : les cartes ayant toutes
    la même taille, un parallaxe différencié ferait lire de fausses profondeurs. */
const PARALLAX = 13;

export function ScrollStory() {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const sticky = stickyRef.current;
    const cta = ctaRef.current;
    const bar = barRef.current;
    if (!wrapper || !sticky || !cta || !bar) return;

    // Repli sans animation : le CSS bascule en grille statique, aucun rAF ne tourne.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      wrapper.classList.add(styles.isStatic);
      return;
    }

    const cards = cardsRef.current.filter((el): el is HTMLDivElement => el !== null);

    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeOutBack = (t: number) => {
      const c1 = 1.35;
      return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    };

    // Grandeurs dépendant du viewport. Recalculées au redimensionnement, et
    // mesurées plutôt que codées en vh : la taille d'une carte vient d'un
    // clamp() CSS, elle n'est connue qu'ici.
    let vw = 0;
    let laneScale = 1;
    let total = 1;
    let travelPx = 0;
    let duration = 0.3;
    let step = 0.05;

    const measure = () => {
      vw = window.innerWidth / 100;
      // Sous 760px le corridor central ne tient plus : on resserre les couloirs
      // pour que les photos restent dans l'écran plutôt que de le déborder.
      laneScale = window.innerWidth < 760 ? 0.5 : 1;
      total = Math.max(1, wrapper.offsetHeight - window.innerHeight);

      // Course d'une photo : de « juste sous le bas de l'écran » à « juste
      // au-dessus du haut ». Déduite de la hauteur réelle d'une carte et non
      // d'une constante en vh — sur un écran court, une valeur fixe laisserait
      // la carte encore visible en fin de course, et elle disparaîtrait d'un coup.
      const cardHeight = cards[0]?.offsetHeight ?? window.innerHeight * 0.5;
      travelPx = window.innerHeight + cardHeight + 16;

      // Le réglage qui compte. Une photo monte d'exactement un pixel par pixel
      // de scroll : sans ça, en entrant dans la section, tout défile plus vite
      // que le reste de la page et le scroll paraît s'emballer (mesuré à 1,90x
      // avant correction, contre 1,00x partout ailleurs). La durée d'une
      // traversée n'est donc pas un réglage libre — elle se déduit de la course
      // disponible. C'est la hauteur de `.wrapper` en CSS qui pilote le nombre
      // de photos simultanément à l'écran : la raccourcir les entasse.
      duration = clamp(travelPx / total, 0.12, 0.6);
      step = (1 - duration * LAST_TRAVEL_AT_END - FIRST_START) / (PHOTOS.length - 1);
    };
    measure();

    const onResize = () => measure();
    window.addEventListener("resize", onResize, { passive: true });

    const hoverCapable = window.matchMedia("(hover: hover)").matches;
    let mouseX = 0;
    let mouseSmoothX = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = sticky.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    };
    if (hoverCapable) sticky.addEventListener("mousemove", onMouseMove, { passive: true });

    const rawProgress = () => {
      const rect = wrapper.getBoundingClientRect();
      return clamp(-rect.top / total, 0, 1);
    };

    const render = (p: number) => {
      bar.style.width = `${(p * 100).toFixed(2)}%`;
      mouseSmoothX = lerp(mouseSmoothX, mouseX, 0.07);

      cards.forEach((card, i) => {
        const cfg = PHOTOS[i];
        const start = FIRST_START + i * step;
        const u = clamp((p - start) / duration, 0, 1);

        // Course linéaire : c'est elle qui donne la sensation de défilement continu.
        // Une courbe d'easing ici ferait « flotter » les photos au lieu de les faire monter.
        const y = lerp(travelPx / 2, -travelPx / 2, u);
        const x = (cfg.lane * laneScale + cfg.drift * u) * vw + mouseSmoothX * PARALLAX;
        const rot = lerp(cfg.rot[0], cfg.rot[1], u);

        card.style.transform =
          `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0)` +
          ` rotate(${rot.toFixed(2)}deg)`;
        // Hors course : on retire la carte du champ plutôt que de la faire disparaître
        // en fondu — le bord de l'écran fait déjà la coupe.
        card.style.visibility = u <= 0 || u >= 1 ? "hidden" : "visible";
      });

      const c = clamp(p / CTA_END, 0, 1);
      cta.style.opacity = `${clamp(c * 1.2, 0, 1)}`;
      cta.style.transform =
        `translate3d(-50%, calc(-50% + ${lerp(16, 0, c).toFixed(1)}px), 0)` +
        ` scale(${lerp(0.94, 1, easeOutBack(c)).toFixed(3)})`;
    };

    let smooth = rawProgress();
    let running = false;
    let frame = 0;

    const loop = () => {
      const raw = rawProgress();
      smooth = lerp(smooth, raw, 0.18);
      if (Math.abs(smooth - raw) < 0.0005) smooth = raw;
      render(smooth);
      if (running) frame = requestAnimationFrame(loop);
    };

    // Le rAF ne tourne que pendant que la section est à l'écran.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !running) {
            running = true;
            frame = requestAnimationFrame(loop);
          } else if (!entry.isIntersecting && running) {
            running = false;
            cancelAnimationFrame(frame);
            render(rawProgress());
          }
        });
      },
      { threshold: 0 },
    );
    observer.observe(wrapper);

    render(smooth);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      if (hoverCapable) sticky.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return (
    <section ref={wrapperRef} className={styles.wrapper} aria-labelledby="scrollstory-titre">
      <div ref={stickyRef} className={styles.sticky}>
        <div className={styles.stage}>
          {PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              ref={(el) => {
                cardsRef.current[i] = el;
              }}
              className={styles.card}
            >
              <div className={styles.frame}>
                <Image
                  src={`/landing/immersive/${photo.src}.webp`}
                  alt={photo.alt}
                  fill
                  sizes="(max-width: 760px) 55vw, 30vw"
                  className={styles.img}
                />
                <span className={styles.label}>{photo.label}</span>
              </div>
            </div>
          ))}

          <div ref={ctaRef} className={styles.cta}>
            <span className={styles.ctaVeil} />
            <span className="mb-[14px] block text-[12.5px] font-bold uppercase tracking-[.14em] text-ink-3">
              L&apos;aventure, capturée
            </span>
            <h2
              id="scrollstory-titre"
              className="font-display text-[clamp(28px,3.6vw,46px)] font-bold leading-[1.08] tracking-[-0.03em] text-ink"
            >
              Chaque sortie mérite
              <br />
              son souvenir.
            </h2>
            <p className="mx-auto mt-4 max-w-[34ch] text-[15.5px] leading-[1.55] text-ink-2">
              Vos clients revivent l&apos;instant. Vous en tirez un revenu, automatiquement.
            </p>
            <ButtonLink href="/liste-attente" variant="sunset" size="lg" className="group mt-6">
              Rejoindre la liste d&apos;attente
              <span
                aria-hidden="true"
                className="transition-transform [@media(hover:hover)]:group-hover:translate-x-[3px]"
              >
                →
              </span>
            </ButtonLink>
          </div>
        </div>

        <div className={styles.progress} aria-hidden="true">
          <div ref={barRef} className={styles.progressFill} />
        </div>
      </div>
    </section>
  );
}

export default ScrollStory;
