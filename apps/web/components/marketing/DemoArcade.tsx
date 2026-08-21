"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { gtmEvent } from "@/lib/gtm";
import styles from "./DemoArcade.module.css";

/* Section « démo produit » — dernière section avant le pied de page.

   Mode « déclencheur personnalisé » d'Arcade : la démo n'est PAS posée dans le
   flux de la page (l'iframe inline laisse des bandes noires, elle ne remplit
   pas la hauteur que son ratio réserve, cf. .arcadeFrame sur /fonctionnement).
   Elle vit ici en position:fixed, height:0, et s'ouvre en surimpression plein
   écran quand on lui demande un « popout » :

     1. au chargement, l'iframe envoie `arcade-init` ;
     2. on lui répond `register-popout-handler`, sans quoi elle ignore la suite ;
     3. le clic sur le trio envoie `request-popout-open` ;
     4. elle répond `arcade-popout-open` / `arcade-popout-close`, seuls moments
        où l'on touche à sa hauteur et à son z-index.

   Composant client : tout repose sur cet échange postMessage.

   `loading="lazy"` est conservé (c'est le snippet d'Arcade) : l'iframe est en
   position:fixed top:0, donc toujours dans le viewport, le navigateur la charge
   immédiatement. Sans ce chargement, `arcade-init` n'arrive jamais et le clic
   resterait sans effet. */

const ARCADE_ID = "bPkIR0jKiJ7fvxzUNK0e";
const ARCADE_ORIGIN = "https://demo.arcade.software";
const ARCADE_SRC = `${ARCADE_ORIGIN}/${ARCADE_ID}?embed&embed_custom&show_copy_link=true`;

/* Trois photos du bloc immersif : le trio évoque une galerie, pas une vidéo. */
const VIGNETTES = [
  { src: "/landing/immersive/parapente-biplace.webp", cls: styles.vLeft },
  { src: "/landing/immersive/canyoning-torrent.webp", cls: styles.vMid },
  { src: "/landing/immersive/escalade-duo.webp", cls: styles.vRight },
];

export function DemoArcade() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function onArcadeMessage(event: MessageEvent) {
      if (event.origin !== ARCADE_ORIGIN || !event.isTrusted) return;

      const data = event.data as { id?: string; event?: string } | null;
      const iframe = iframeRef.current;
      if (!data || !iframe || !iframe.contentWindow) return;
      // Une seule démo sur la page : on accepte les messages sans `id`.
      if (data.id && data.id !== ARCADE_ID) return;

      if (data.event === "arcade-init") {
        iframe.contentWindow.postMessage({ event: "register-popout-handler" }, ARCADE_ORIGIN);
      }
      if (data.event === "arcade-popout-open") {
        iframe.style.height = "100%";
        iframe.style.zIndex = "9999999";
      }
      if (data.event === "arcade-popout-close") {
        iframe.style.height = "0";
        iframe.style.zIndex = "auto";
      }
    }

    window.addEventListener("message", onArcadeMessage);
    return () => window.removeEventListener("message", onArcadeMessage);
  }, []);

  function ouvrirDemo() {
    const iframe = iframeRef.current;
    if (!iframe || !iframe.contentWindow) return;
    gtmEvent("cta_click", { cta_id: "demo_arcade", cta_location: "accueil" });
    iframe.contentWindow.postMessage({ event: "request-popout-open" }, ARCADE_ORIGIN);
  }

  return (
    <section className={styles.section} aria-labelledby="demo-produit">
      {/* Sans JS, .reveal (globals.css) resterait à opacity:0. */}
      <noscript>
        <style>{".reveal{opacity:1 !important;transform:none !important}"}</style>
      </noscript>

      <div className={styles.head}>
        <p className={`${styles.eyebrow} reveal`}>La démo</p>
        <h2 id="demo-produit" className={`${styles.h2} reveal reveal-d1`}>
          Entrez dans la galerie <span className={styles.grad}>de vos clients</span>.
        </h2>
        <p className={`${styles.sub} reveal reveal-d2`}>
          Ils reçoivent un lien après la sortie, retrouvent leurs photos et les achètent.
        </p>
      </div>

      <div className={`${styles.trigger} reveal reveal-d3`}>
        <button
          type="button"
          className={styles.trio}
          aria-haspopup="dialog"
          aria-label="Voir la démo : le parcours d'achat des photos, 1 min 40"
          onClick={ouvrirDemo}
        >
          {VIGNETTES.map((v) => (
            <Image
              key={v.src}
              src={v.src}
              alt=""
              width={420}
              height={560}
              sizes="(max-width: 700px) 30vw, 224px"
              className={`${styles.vignette} ${v.cls}`}
            />
          ))}
          <span className={styles.play} aria-hidden="true">
            <svg width="26" height="30" viewBox="0 0 14 16" fill="none">
              <path
                d="M13 7.13a1 1 0 0 1 0 1.74l-11 6.3A1 1 0 0 1 .5 14.3V1.7A1 1 0 0 1 2 .83l11 6.3Z"
                fill="currentColor"
              />
            </svg>
          </span>
        </button>
        <p className={styles.micro}>1 min 40</p>
      </div>

      <iframe
        ref={iframeRef}
        src={ARCADE_SRC}
        title="Acheter et télécharger toutes les photos de son activité"
        loading="lazy"
        allowFullScreen
        allow="clipboard-write; autoplay"
        className={styles.popout}
      />

      <ScrollReveal />
    </section>
  );
}

export default DemoArcade;
