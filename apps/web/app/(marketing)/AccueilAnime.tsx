"use client";

import { useEffect } from "react";

/* Comportements de l'accueil, portés tels quels depuis docs/maquette-accueil-v6.html.

   Le balisage vit dans page.tsx (composant serveur) ; ce composant ne rend rien
   et se contente d'animer ce balisage une fois monté. React ne re-rend jamais
   ces nœuds après l'hydratation : les classes posées ici (`on`, `sel`, `show`…)
   ne sont donc pas écrasées. Toute la logique est impérative pour la même raison
   que le moteur de <Parcours> sur /produit : une trentaine de minuteries
   synchronisées sur ~19 s, que des états React feraient re-rendre en boucle.

   Trois choses font la démo du téléphone :
   1. `show(n)` affiche l'écran n (0 pro, 1 réception, 2 choix, 3 paiement) et
      programme ses gestes ; `clear()` annule tout ce qui est en attente.
   2. Le doigt (#fg) se déplace par la propriété `translate` et s'enfonce par
      `scale` : deux propriétés distinctes, sans quoi l'appui écrase le
      déplacement et le rond « sursaute ».
   3. La démo s'arrête hors écran et sur le bouton pause ; avec
      prefers-reduced-motion, elle reste figée sur l'écran de choix. */

export function AccueilAnime() {
  useEffect(() => {
    const cleanups: (() => void)[] = [];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ── Apparition au défilement ── */
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".accx .rv").forEach((el) => io.observe(el));
    cleanups.push(() => io.disconnect());

    /* ── Flèches du bandeau d'activités ── */
    const track = document.getElementById("track");
    document.querySelectorAll<HTMLButtonElement>(".accx .actsCtl button").forEach((b) => {
      const onClick = () => {
        const card = track?.querySelector(".card");
        if (!track || !card) return;
        const step = (card.getBoundingClientRect().width + 14) * 2;
        track.scrollBy({ left: step * Number(b.dataset.dir), behavior: reduce ? "auto" : "smooth" });
      };
      b.addEventListener("click", onClick);
      cleanups.push(() => b.removeEventListener("click", onClick));
    });

    /* ── Démo du héros ── */
    const $ = (id: string) => document.getElementById(id) as HTMLElement;
    const hx = $("hx");
    const scr = $("scr");
    const fg = $("fg");
    const side = $("side");
    const pp = $("pp");
    if (!hx || !scr || !fg || !side || !pp) return () => cleanups.forEach((c) => c());

    const sc = Array.from(scr.querySelectorAll<HTMLElement>(".sc"));
    const li = Array.from(document.querySelectorAll<HTMLElement>("#flow li"));
    const STEP = [0, 1, 2, 2];
    const DUR = [4600, 4600, 5200, 4800];
    const tr = $("tr");
    const take = $("take");
    const buy = $("buy");
    const dots = Array.from(document.querySelectorAll<HTMLElement>("#dots i"));
    const photos = Array.from(tr.children) as HTMLElement[];
    const sideLabel = side.querySelector("span") as HTMLElement;
    let cur = 0;
    let timers: number[] = [];
    let raf = 0;
    let playing = !reduce;
    let userPaused = false;

    const at = (ms: number, fn: () => void) => {
      timers.push(window.setTimeout(fn, ms));
    };
    // Doigt rangé : invisible tout de suite, sans transition, pour qu'il ne glisse jamais d'un écran à l'autre.
    const park = () => {
      fg.style.transition = "none";
      fg.classList.remove("show", "press");
      void fg.offsetWidth;
      fg.style.transition = "";
    };
    const clear = () => {
      timers.forEach((t) => window.clearTimeout(t));
      timers = [];
      cancelAnimationFrame(raf);
      park();
    };
    const place = (el: Element, dx = 0, dy = 0) => {
      const a = el.getBoundingClientRect();
      const b = scr.getBoundingClientRect();
      fg.style.translate = `${a.left - b.left + a.width / 2 + dx}px ${a.top - b.top + a.height / 2 + dy}px`;
    };
    // Le doigt arrive 550 ms avant l'appui, puis se recale au pixel juste avant.
    const tap = (el: HTMLElement, t: number, cb?: () => void) => {
      at(t - 550, () => {
        if (!fg.classList.contains("show")) {
          fg.style.transition = "none";
          place(el, 26, 48);
          void fg.offsetWidth;
          fg.style.transition = "";
        }
        fg.classList.add("show");
        requestAnimationFrame(() => place(el));
      });
      at(t - 60, () => place(el));
      at(t, () => {
        fg.classList.remove("press");
        void fg.offsetWidth;
        fg.classList.add("press");
        el.classList.remove("pressed");
        void el.offsetWidth;
        el.classList.add("pressed");
        cb?.();
      });
    };
    const hideFg = (t: number) => {
      at(t, () => fg.classList.remove("show"));
      at(t + 300, () => {
        if (!fg.classList.contains("show")) park();
      });
    };
    const setTake = (on: boolean) => {
      take.classList.toggle("on", on);
      const em = take.querySelector("em");
      if (em) em.textContent = on ? "Choisie" : "Prendre";
    };
    const stepDur = (s: number) => STEP.reduce((acc, v, i) => (v === s ? acc + DUR[i] : acc), 0);

    // Seul l'écran qui entre repart de zéro : celui qui sort garde son état pendant le fondu.
    const reset = (n: number) => {
      if (n === 0) {
        sc[0].classList.remove("go");
        $("toast").classList.remove("show");
        $("cnt").textContent = "0 photo déposée";
      }
      if (n === 1) {
        $("notif").classList.remove("show");
        $("mail").classList.remove("show");
      }
      if (n === 2) {
        tr.style.transform = "";
        photos.forEach((p) => p.classList.remove("sel"));
        setTake(false);
        buy.textContent = "Tout prendre · 25 €";
        dots.forEach((d, i) => d.classList.toggle("on", i === 0));
      }
      if (n === 3) {
        sc[3].classList.remove("go");
        $("ok").classList.remove("show");
        $("apay").classList.remove("busy");
      }
    };

    const show = (n: number) => {
      clear();
      reset(n);
      sc.forEach((el, i) => {
        el.classList.toggle("on", i === n);
        el.classList.toggle("out", i < n);
      });
      const s = STEP[n];
      li.forEach((l, i) => {
        if (i !== s) {
          l.classList.remove("on");
          return;
        }
        if (!(l.classList.contains("on") && n === 3)) {
          l.classList.remove("on");
          void l.offsetWidth;
          l.style.setProperty("--dur", `${stepDur(s)}ms`);
          l.classList.add("on");
        }
      });
      side.classList.toggle("cl", n > 0);
      sideLabel.textContent = n ? "Côté client" : "Côté pro";
      $("clock").textContent = ["19:02", "19:10", "19:11", "19:12"][n];
      cur = n;
      scr.classList.toggle("dark", n === 1);

      if (n === 0) {
        // dépôt, puis publication
        void sc[0].offsetWidth;
        sc[0].classList.add("go");
        sc[0].querySelectorAll<HTMLElement>(".gr img").forEach((im, i) => {
          im.style.animationDelay = `${0.1 + i * 0.15}s`;
        });
        const t0 = performance.now();
        const tick = () => {
          const p = Math.min(1, (performance.now() - t0) / 2400);
          const k = Math.round(p * 48);
          $("cnt").textContent = k + (k > 1 ? " photos déposées" : " photo déposée");
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        tap($("pub"), 2900, () => at(250, () => $("toast").classList.add("show")));
        hideFg(3400);
      }
      if (n === 1) {
        // notification, e-mail, lien
        at(500, () => $("notif").classList.add("show"));
        tap($("notif"), 1700, () =>
          at(150, () => {
            $("mail").classList.add("show");
            scr.classList.remove("dark");
          }),
        );
        hideFg(2000);
        tap($("open"), 3700);
        hideFg(4100);
      }
      if (n === 2) {
        // choisir deux photos
        tap(take, 1200, () => {
          photos[0].classList.add("sel");
          setTake(true);
          buy.textContent = "Prendre cette photo · 4 €";
        });
        at(1700, () => place(photos[0], 40, 0));
        at(2000, () => {
          place(photos[0], -70, 0);
          tr.style.transform = `translateX(${-(photos[0].getBoundingClientRect().width + 8)}px)`;
          setTake(false);
          dots.forEach((d, i) => d.classList.toggle("on", i === 1));
        });
        tap(take, 3000, () => {
          photos[1].classList.add("sel");
          setTake(true);
          buy.textContent = "Prendre ces 2 photos · 8 €";
        });
        tap(buy, 4300);
        hideFg(4700);
      }
      if (n === 3) {
        // paiement puis confirmation
        at(150, () => sc[3].classList.add("go"));
        tap($("apay"), 1500, () => $("apay").classList.add("busy"));
        hideFg(1900);
        at(2500, () => $("ok").classList.add("show"));
      }
      if (playing) at(DUR[n], () => show((n + 1) % sc.length));
    };

    const setPlaying = (p: boolean) => {
      playing = p;
      hx.classList.toggle("paused", !p);
      pp.classList.toggle("paused", !p);
      pp.setAttribute("aria-label", p ? "Mettre la démonstration en pause" : "Relancer la démonstration");
      if (p) show(cur);
      else clear();
    };

    const onPause = () => {
      userPaused = playing;
      setPlaying(!playing);
    };
    pp.addEventListener("click", onPause);
    cleanups.push(() => pp.removeEventListener("click", onPause));
    li.forEach((l) => {
      const onStep = () => show(STEP.indexOf(Number(l.dataset.s)));
      l.addEventListener("click", onStep);
      cleanups.push(() => l.removeEventListener("click", onStep));
    });

    if (reduce) {
      sc.forEach((el, i) => el.classList.toggle("on", i === 2));
      li.forEach((l, i) => l.classList.toggle("on", i === 2));
      side.classList.add("cl");
      sideLabel.textContent = "Côté client";
      photos[0].classList.add("sel");
      setTake(true);
      buy.textContent = "Prendre cette photo · 4 €";
    } else {
      show(0);
    }

    const heroIo = new IntersectionObserver(
      ([e]) => {
        if (reduce || userPaused) return;
        if (!e.isIntersecting && playing) setPlaying(false);
        else if (e.isIntersecting && !playing) setPlaying(true);
      },
      { threshold: 0 },
    );
    heroIo.observe(hx);
    cleanups.push(() => heroIo.disconnect());
    cleanups.push(clear);

    return () => cleanups.forEach((c) => c());
  }, []);

  return null;
}

export default AccueilAnime;
