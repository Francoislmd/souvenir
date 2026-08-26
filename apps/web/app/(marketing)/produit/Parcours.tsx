/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";

/* Section « Comment ça marche » de /produit : quatre onglets, un panneau à la
   fois, une scène animée par panneau.

   Le moteur d'animation est repris tel quel de la maquette
   (docs/maquette-produit-v1.html, règles détaillées dans docs/DA-page-produit.md) :

   1. UNE SEULE HORLOGE de 11 s. Toutes les keyframes durent 11 s et bouclent
      ensemble. Les décalages courts passent par `animation-delay`, les longs
      ont leurs propres keyframes, sinon leur sortie déborde sur le tour suivant.
   2. UNE SEULE SCÈNE TOURNE À LA FOIS : elle démarre quand la section entre
      dans le viewport, s'arrête quand elle en sort ou que l'onglet du
      navigateur passe en arrière-plan.
   3. REDÉMARRAGE PROPRE au changement d'onglet : retirer `.play`, forcer un
      reflow, la remettre. Sans le reflow, les keyframes reprennent où elles
      en étaient.
   4. `prefers-reduced-motion` laisse la scène sur son état d'arrivée, jamais
      sur un écran vide (règles en fin de produit.css).
   5. Les compteurs `[data-count]` suivent la même horloge, via un unique
      requestAnimationFrame. Aucune librairie.

   Piège vérifié : tout élément animé DOIT porter une classe préfixée « sc ».
   Le sélecteur d'horloge est `.scene [class^="sc"]` ; un élément sans classe
   reçoit bien un `animation-name` mais aucune durée, ne bouge jamais, et
   n'émet aucune erreur. */

const CYCLE = 11000;

const ONGLETS = [
  { n: "01", label: "La sortie" },
  { n: "02", label: "Les photos" },
  { n: "03", label: "Le client" },
  { n: "04", label: "Le paiement" },
];

export function Parcours() {
  const [actif, setActif] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  const t0Ref = useRef(0);
  const sceneRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Chaque [data-count] monte de data-from à data-to entre data-start et
       data-end, exprimés en fraction du cycle. */
    function compteurs(t: number) {
      const scene = sceneRef.current;
      if (!scene) return;
      scene.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
        const debut = parseFloat(el.dataset.start ?? "0") * CYCLE;
        const fin = parseFloat(el.dataset.end ?? "1") * CYCLE;
        const de = parseFloat(el.dataset.from ?? "0");
        const vers = parseFloat(el.dataset.to ?? "0");
        const k = t <= debut ? 0 : t >= fin ? 1 : (t - debut) / (fin - debut);
        const v = de + (vers - de) * k;
        el.textContent =
          el.dataset.dec === "2" ? v.toFixed(2).replace(".", ",") : String(Math.round(v));
      });
    }

    function frame() {
      if (!sceneRef.current) return;
      compteurs((performance.now() - t0Ref.current) % CYCLE);
      rafRef.current = requestAnimationFrame(frame);
    }

    function arreter() {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      sceneRef.current?.classList.remove("play");
      sceneRef.current = null;
    }

    function demarrer() {
      arreter();
      if (reduit) return;
      // Relu depuis la ref : le nœud peut avoir été démonté entre deux appels.
      const scene = sectionRef.current?.querySelector<HTMLElement>(".panel.is-on [data-anim]");
      if (!scene) return;
      sceneRef.current = scene;
      scene.classList.remove("play");
      void scene.offsetWidth; // force le reflow : les keyframes repartent de zéro
      scene.classList.add("play");
      t0Ref.current = performance.now();
      frame();
    }

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? demarrer() : arreter())),
      { threshold: 0.25 },
    );
    io.observe(section);

    const onVisibilite = () => (document.hidden ? arreter() : demarrer());
    document.addEventListener("visibilitychange", onVisibilite);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibilite);
      arreter();
    };
    // `actif` en dépendance : changer d'onglet redémarre la scène du panneau visible.
  }, [actif]);

  return (
    <section className="band band--cream" id="fonctionnalites" ref={sectionRef}>
      <div className="rail">
        <div style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto" }}>
          <p className="kicker reveal">Comment ça marche</p>
          <h2 className="h2 reveal" style={{ marginTop: "14px" }}>Ce qui se passe après la sortie.</h2>
          <p className="lead reveal" style={{ marginTop: "14px" }}>Quatre étapes. Vous n&apos;intervenez que dans la deuxième.</p>
        </div>

        <div className="tabs reveal" role="tablist" aria-label="Les quatre étapes">
          {ONGLETS.map((o, i) => (
            <button
              key={o.n}
              className="tab"
              role="tab"
              type="button"
              aria-selected={i === actif}
              onClick={() => setActif(i)}
            >
              <span className="tabNum">{o.n}</span>
              {o.label}
            </button>
          ))}
        </div>

        {/* La sortie */}
        <div className={`panel${actif === 0 ? " is-on" : ""}`} data-p="0">
          <div className="panel__txt">
            <div className="stepHead"><span className="stepNum">01</span><span className="kicker">La sortie</span><small>· étape 1 sur 4</small></div>
            <h3 className="h3">Vos sorties arrivent toutes seules.</h3>
            <p className="lead">Branchez votre plateforme de réservation, les sorties et leurs créneaux se remplissent tout seuls. Sinon, trois champs suffisent : la date, l&apos;activité, l&apos;heure.</p>
            <span className="panel__note"><svg className="ico ico--s" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9.5h16M9 3v4m6-4v4" /></svg>Vos réservations restent chez vous, Linktrip ne fait que les lire</span>
          </div>
          <div className="shot">
            <div className="shot__win" data-anim="sortie">
              <div className="shot__top"><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#726c80" strokeWidth="10" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="#726c80" stroke="none" /></svg><span>Sorties</span><em>Semaine du 11 août</em></div>
              <div className="shot__body">
                <div className="scene">
                  <div className="scSess">
                    <div className="scSessHead"><b>Vos sorties</b><span className="scSync">Réservations synchronisées</span></div>
                    <div className="scSessRow scRowIn scS1"><span className="scAct"><svg viewBox="0 0 24 24" role="img" aria-label="Canyoning"><title>Canyoning</title><path d="M4 3v10.5" /><path d="M20 3v10.5" /><path d="M12 3.5v7" /><path d="M12 10.5c0 2.2 1.4 2.6 1.4 4.4" /><path d="M10.4 3.5a1.6 1.6 0 1 1 3.2 0" /><path d="M4 13.5h3M17 13.5h3" /><path d="M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg></span><span className="scTxt"><b>jeu. 12 août</b><small>3 créneaux<span className="scMetaWide"> · 18 participants</span></small></span><span className="scSrc">Réservations</span><span className="scPick"><svg viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg></span></div>
                    <div className="scSessRow scRowIn" style={{ animationDelay: "160ms" }}><span className="scAct"><svg viewBox="0 0 24 24" role="img" aria-label="Rafting"><title>Rafting</title><path d="M2.4 12.6h19.2l-2.3 4.6H4.7L2.4 12.6Z" /><path d="M8.6 12.6 15 4.4" /><path d="m13.6 3.1 2.9 2.2-1.7 2.3-2.9-2.2 1.7-2.3Z" /><path d="M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg></span><span className="scTxt"><b>jeu. 12 août</b><small>1 créneau<span className="scMetaWide"> · 6 participants</span></small></span><span className="scSrc">Réservations</span></div>
                    <div className="scSessRow scRowIn" style={{ animationDelay: "320ms" }}><span className="scAct"><svg viewBox="0 0 24 24" role="img" aria-label="Canyoning"><title>Canyoning</title><path d="M4 3v10.5" /><path d="M20 3v10.5" /><path d="M12 3.5v7" /><path d="M12 10.5c0 2.2 1.4 2.6 1.4 4.4" /><path d="M10.4 3.5a1.6 1.6 0 1 1 3.2 0" /><path d="M4 13.5h3M17 13.5h3" /><path d="M2.5 20.4c1.3-1.1 2.6-1.1 3.9 0s2.6 1.1 3.9 0 2.6-1.1 3.9 0 2.6 1.1 3.9 0" /></svg></span><span className="scTxt"><b>ven. 13 août</b><small>2 créneaux<span className="scMetaWide"> · 11 participants</span></small></span><span className="scSrc">Réservations</span></div>
                    <div className="scBottom">
                      <div className="scForm">
                        <i className="scRing1"><u>Date</u><em className="scF1">sam. 14 août</em></i>
                        <i className="scRing2"><u>Activité</u><em className="scF2">Parc aventure</em></i>
                        <i className="scRing3"><u>Heure</u><em className="scF3">10 h 00</em></i>
                        <span className="scGo">Créer</span>
                      </div>
                    <div className="scSessRow scS4"><span className="scAct"><svg viewBox="0 0 24 24" role="img" aria-label="Parc aventure"><title>Parc aventure</title><path d="M4.4 4.6v15" /><path d="M19.6 4.6v15" /><path d="M4.4 8.6c3.6 2.4 7.6 2.4 11.2 0" /><path d="M8.8 12.6c3.6 2.4 7.2 2.4 10.8 0" /><path d="M2.6 19.6h18.8" /><path d="M13.2 8.6v1.6M9.6 12.6v1.6" /></svg></span><span className="scTxt"><b>sam. 14 août</b><small>1 créneau<span className="scMetaWide"> · 9 participants</span></small></span><span className="scSrc man">Créée à la main</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dépôt */}
        <div className={`panel${actif === 1 ? " is-on" : ""}`} data-p="1">
          <div className="panel__txt">
            <div className="stepHead"><span className="stepNum">02</span><span className="kicker">Les photos</span><small>· étape 2 sur 4</small></div>
            <h3 className="h3">Vous videz votre carte mémoire.</h3>
            <p className="lead">Tout part en une fois, la journée entière. Chaque photo rejoint son créneau grâce à son heure de prise de vue.</p>
            <span className="panel__note"><svg className="ico ico--s" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 8v5l3 2" /></svg>Compter deux minutes pour une sortie de 120 photos</span>
          </div>
          <div className="shot">
            <div className="shot__win" data-anim="depot">
              <div className="shot__top"><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#726c80" strokeWidth="10" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="#726c80" stroke="none" /></svg><span>Sortie du 12 août · Canyoning</span><em>42 photos</em></div>
              <div className="shot__body">
                <div className="scene">

                  {/* Temps 1 : la zone attend, la pile de photos arrive */}
                  <div className="scZone">
                    <span className="scZoneIco"><svg viewBox="0 0 24 24"><path d="M12 16.5V4m0 0L7 9m5-5 5 5" /><path d="M4 15.5v3A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5v-3" /></svg></span>
                    <b>Déposez les photos de la sortie</b>
                    <small>Depuis votre carte mémoire, en une fois</small>
                  </div>
                  <div className="scDrag">
                    <i><img src="/produit/thumb-rafting-eaux-vives.webp" alt="" /></i>
                    <i><img src="/produit/thumb-snorkeling-surface.webp" alt="" /></i>
                    <i><img src="/produit/thumb-canyoning-cascade.webp" alt="" /></i>
                    <b>42 photos</b>
                    <u><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 2.5 18.5 12 12 13.2 9.6 19.5z" strokeLinejoin="round" /></svg></u>
                  </div>

                  {/* Temps 2 : le téléversement */}
                  <div className="scUp">
                    <div className="scUpHead"><b>Téléversement</b><span><em className="scCount" style={{ fontStyle: "normal" }} data-count data-from="0" data-to="42" data-start="0.29" data-end="0.52">0</em> / 42</span></div>
                    <div className="scUpTrack"><i className="scFill"></i></div>
                    <div className="scUpGrid"><span><img style={{ animationDelay: "0ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /></span><span><img style={{ animationDelay: "128ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /></span><span><img style={{ animationDelay: "256ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /></span><span><img style={{ animationDelay: "384ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /></span><span><img style={{ animationDelay: "512ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /></span><span><img style={{ animationDelay: "640ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /></span><span><img style={{ animationDelay: "768ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /></span><span><img style={{ animationDelay: "896ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /></span><span><img style={{ animationDelay: "1024ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /></span><span><img style={{ animationDelay: "1152ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /></span><span><img style={{ animationDelay: "1280ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /></span><span><img style={{ animationDelay: "1408ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /></span><span><img style={{ animationDelay: "1536ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /></span><span><img style={{ animationDelay: "1664ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /></span><span><img style={{ animationDelay: "1792ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /></span><span><img style={{ animationDelay: "1920ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /></span><span><img style={{ animationDelay: "2048ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /></span><span><img style={{ animationDelay: "2176ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /></span></div>
                    <p className="scUpNote">Les photos se rangent par créneau grâce à l&apos;heure de prise de vue.</p>
                  </div>

                  {/* Temps 3 : les créneaux remplis */}
                  <div className="scSlots">
                    <div className="slot scRowA"><b>09 h 00</b><small>18 photos</small><span className="scBadge scBadgeA">Publié</span></div>
                    <div className="strip"><img className="scThumbA" style={{ animationDelay: "0ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /><img className="scThumbA" style={{ animationDelay: "60ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /><img className="scThumbA" style={{ animationDelay: "120ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /><img className="scThumbA" style={{ animationDelay: "180ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /><img className="scThumbA" style={{ animationDelay: "240ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /><img className="scThumbA" style={{ animationDelay: "300ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /></div>
                    <div className="slot scRowB"><b>11 h 30</b><small>16 photos</small><span className="scBadge scBadgeB">Publié</span></div>
                    <div className="strip"><img className="scThumbB" style={{ animationDelay: "0ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /><img className="scThumbB" style={{ animationDelay: "60ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /><img className="scThumbB" style={{ animationDelay: "120ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /><img className="scThumbB" style={{ animationDelay: "180ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /><img className="scThumbB" style={{ animationDelay: "240ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /><img className="scThumbB" style={{ animationDelay: "300ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /></div>
                    <div className="slot scRowC"><b>14 h 00</b><small>8 photos</small><span className="scBadge scBadgeC">Publié</span></div>
                    <div className="strip"><img className="scThumbC" style={{ animationDelay: "0ms" }} src="/produit/thumb-rafting-eaux-vives.webp" alt="" /><img className="scThumbC" style={{ animationDelay: "60ms" }} src="/produit/thumb-escalade-falaise.webp" alt="" /><img className="scThumbC" style={{ animationDelay: "120ms" }} src="/produit/thumb-tyrolienne-foret.webp" alt="" /><img className="scThumbC" style={{ animationDelay: "180ms" }} src="/produit/thumb-snorkeling-surface.webp" alt="" /><img className="scThumbC" style={{ animationDelay: "240ms" }} src="/produit/thumb-parapente-biplace.webp" alt="" /><img className="scThumbC" style={{ animationDelay: "300ms" }} src="/produit/thumb-canyoning-cascade.webp" alt="" /></div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Protection */}
        <div className={`panel${actif === 2 ? " is-on" : ""}`} data-p="2">
          <div className="panel__txt">
            <div className="stepHead"><span className="stepNum">03</span><span className="kicker">Le client</span><small>· étape 3 sur 4</small></div>
            <h3 className="h3">Rien ne sort avant le paiement.</h3>
            <p className="lead">Votre client reçoit un lien, découvre ses photos en aperçu flouté, et choisit. Le fichier net n&apos;arrive qu&apos;une fois le paiement confirmé.</p>
            <span className="panel__note"><svg className="ico ico--s" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="10" rx="2.5" /><path d="M8 10V7.5a4 4 0 0 1 8 0V10" /></svg>Les fichiers originaux ne circulent jamais</span>
          </div>
          <div className="shot">
            <div className="shot__win" data-anim="protection">
              <div className="shot__top"><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#726c80" strokeWidth="10" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="#726c80" stroke="none" /></svg><span>Galerie du client</span><em className="scSwap"><span className="scLbl scLblA">Aperçu protégé</span><span className="scLbl scLblB">Fichier livré</span></em></div>
              <div className="shot__body" style={{ padding: "0" }}>
                <div className="scene">
                  <div className="scProt">
                    <img src="/produit/prot.webp" alt="Photo de la sortie, fichier original" />
                    <div className="scVeil">
                      <img src="/produit/prot.webp" alt="" />
                      <div className="scWm"><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div><div className="scWmRow"><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span><span><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="9" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="rgba(255,255,255,.4)" stroke="none" /></svg>LINKTRIP</span></div></div>
                    </div>
                    <span className="scLock"><svg viewBox="0 0 24 24" aria-hidden="true"><path className="scShackle" d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" /><rect x="4.5" y="10.5" width="15" height="9.5" rx="2.4" /><path d="M12 14v2.5" /></svg></span>
                    <span className="scEdge"></span>
                    <div className="scBar scBarA"><svg viewBox="0 0 24 24"><path d="M2.6 12S6.4 6 12 6s9.4 6 9.4 6-3.8 6-9.4 6-9.4-6-9.4-6Z" /><circle cx="12" cy="12" r="2.6" /></svg><b>Aperçu protégé</b><small>Pack complet · 24 €</small><span className="scGo2">Payer</span></div>
                    <div className="scBar scBarB"><svg viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg><b>Paiement confirmé</b><small>24,00 €</small></div>
                    <div className="scBar scBarC"><svg viewBox="0 0 24 24"><path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5" /><path d="M4.5 17v1.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V17" /></svg><b>Fichier original livré</b><small>4000 × 3000 · JPEG</small></div>
                  </div>
                </div>
              </div>        </div>
          </div>
        </div>

        {/* Encaissement */}
        <div className={`panel${actif === 3 ? " is-on" : ""}`} data-p="3">
          <div className="panel__txt">
            <div className="stepHead"><span className="stepNum">04</span><span className="kicker">Le paiement</span><small>· étape 4 sur 4</small></div>
            <h3 className="h3">Vous fixez les prix, vous touchez l&apos;argent.</h3>
            <p className="lead">Le prix d&apos;une photo, celui du pack complet, et la galerie s&apos;ouvre à la vente. Chaque achat est encaissé sur votre compte Stripe.</p>
            <span className="panel__note"><svg className="ico ico--s" viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="2.5" /><path d="M3.5 10h17" /></svg>Vous êtes payé par Stripe, comme pour vos réservations</span>
          </div>
          <div className="shot">
            <div className="shot__win" data-anim="boutique">
              <div className="shot__top"><svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke="#726c80" strokeWidth="10" strokeLinecap="round"><path d="M58 20 H36 A16 16 0 0 0 20 36 V64 A16 16 0 0 0 36 80 H64 A16 16 0 0 0 80 64 V42" /><circle cx="73" cy="27" r="10" fill="#726c80" stroke="none" /></svg><span>Réglages · Boutique</span><em className="scSwap"><span className="scLbl scOnA">Brouillon</span><span className="scLbl scOnB">En ligne</span></em></div>
              <div className="shot__body">
                <div className="scene">
                  <div className="scShop">
                    <div className="scSeg">
                      <span className="scSegOn"></span>
                      <span className="scSegL">Photo seule</span>
                      <span className="scSegR">Toutes les photos</span>
                    </div>
                    <div className="scLine"><span>Prix d&apos;une photo</span><b><em style={{ fontStyle: "normal" }} data-count data-from="0" data-to="6" data-dec="2" data-start="0.18" data-end="0.26">0,00</em> €</b></div>
                    <div className="scLine"><span>Pack complet de la sortie</span><b><em style={{ fontStyle: "normal" }} data-count data-from="0" data-to="24" data-dec="2" data-start="0.24" data-end="0.33">0,00</em> €</b></div>
                    <div className="scLine" style={{ borderBottom: "0", paddingBottom: "4px" }}><span>Votre part</span><b><em style={{ fontStyle: "normal" }} data-count data-from="0" data-to="80" data-start="0.24" data-end="0.34">0</em> %</b></div>
                    <div className="scSplit"><i className="scFill2"></i></div>
                    <div className="scLine"><span>Compte de versement</span>
                      <span className="scStripe">
                        <span className="scPill scPillA"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" /><path d="M12 8v4.5l2.5 1.5" /></svg>Connexion en attente</span>
                        <span className="scPill scPillB"><svg viewBox="0 0 24 24"><path d="m4 12.5 5 5L20 6.5" /></svg>Stripe connecté</span>
                      </span>
                    </div>
                    <div className="scSale"><span className="av b">CL</span><span><b>Nouvelle vente</b><small>Claire L. · pack complet</small></span><u>24,00 €</u></div>
                  </div>
                </div>
              </div>        </div>
          </div>
        </div>

      </div>
    </section>
  );
}
