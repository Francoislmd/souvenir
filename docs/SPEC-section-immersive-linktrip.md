# SPEC — Section immersive « scroll storytelling »

Composants : `apps/web/components/marketing/ScrollStory.tsx`,
`ScrollStory.module.css`. Images : `apps/web/public/landing/immersive/`.

## 0. Intention

Une respiration émotionnelle entre le bandeau d'activités et le pied de page :
des photos de sortie **montent du bas vers le haut** pendant que la page est
retenue, et encadrent un CTA posé au centre. On ne vend pas une fonctionnalité
ici, on montre ce que le client final achètera.

**Garde-fous, non négociables.**

1. La section n'a de valeur que si on voit des **gens** vivre l'activité. Une
   photo de paysage, de matériel ou de texture n'y a pas sa place : elle
   transforme la section en fond d'écran. À l'ajout d'une photo, vérifier que le
   sujet humain est lisible **à la taille d'affichage** (230–370 px de large),
   pas à 100 %.
2. **Toutes les photos ont exactement le même format** : 900×1200, ratio 3:4,
   même largeur d'affichage. Aucune variation de taille, d'orientation ni
   d'échelle. Le rythme vient des couloirs, des rotations et du décalage
   temporel. Une seule photo au mauvais ratio casse la lecture de l'ensemble.

## 1. Montage

Client Component (`"use client"`) : l'animation lit la position de scroll à
chaque frame, rien de tout cela n'est exprimable en CSS seul. Aucune dépendance
ajoutée — pas de `framer-motion`, pas de GSAP, pas de ScrollTrigger.

Monté dans `app/(marketing)/page.tsx` en **frère de `.rail`**, après
`<ActivityMarquee />` et avant `<Footer />` : la section porte son propre pin et
doit occuper toute la largeur. La placer dans `.rail` la mettrait en concurrence
avec le hero pour le même écran (cf. SPEC bandeau d'activités §1).

## 2. Mécanique

Le scroll n'est **jamais** intercepté (`preventDefault` sur `wheel` casse le
trackpad, le clavier et l'accessibilité). On utilise le pin classique :

- `.wrapper` haute de `380svh` ;
- `.sticky` en `position: sticky; top: 0; height: 100svh; overflow: hidden`.

Tant que le wrapper défile, le sticky reste collé : le scroll paraît « capturé »
alors qu'il est normal. La progression `p ∈ [0,1]` vaut
`-wrapper.top / (wrapper.height - innerHeight)`.

**Vérifié** : `position: sticky` fonctionne malgré `body { overflow-x: hidden }`
(globals.css) — mesuré à 0 px de dérive sur toute la course, en 1440×900 et
390×844. C'est le piège documenté dans `landing.module.css` §haloClip ; il ne se
déclenche pas ici parce qu'aucun ancêtre de la section ne porte d'`overflow`.

### Course d'une photo

Chaque photo traverse l'écran de `+80vh` à `-80vh`, **en linéaire** : toute
courbe d'easing la ferait « flotter » au lieu de monter. Elle n'apparaît ni ne
disparaît en fondu — c'est le `overflow: hidden` du cadre qui la coupe, comme une
bande qui défile.

| Constante | Valeur | Rôle |
|---|---|---|
| `DURATION` | `0.3` | part de la course consommée par une traversée |
| `FIRST_START` | `-0.16` | la 1re photo est déjà engagée à l'entrée (jamais d'écran vide) |
| `LAST_TRAVEL_AT_END` | `0.72` | la dernière photo est **encore en vol** au relâchement |

`LAST_TRAVEL_AT_END < 1` est délibéré : si toutes les photos sortaient avant la
fin, le dernier tiers de la section serait un écran blanc à scroller pour rien.
Deux à trois photos sont encore à l'écran quand le sticky se libère, et s'en vont
naturellement avec la page.

Densité obtenue : ~5,4 photos en vol simultanément (`DURATION / step`). En
dessous de 4 la section paraît vide, au-dessus de 7 elle devient illisible.

## 3. Le corridor central

Les couloirs (`lane`, en vw depuis le centre) sont tous à **|lane| ≥ 29,5** : les
photos encadrent le CTA au lieu de lui passer dessus. C'est la seule façon de
garder un titre en encre sombre lisible sur fond blanc — testé, une photo sombre
qui traverse le titre le rend illisible, et aucun voile raisonnable ne le rattrape
à cette taille.

Sous 760 px le corridor ne tient plus (écran trop étroit) : `laneScale` passe à
`0.5` et `.ctaVeil` devient franc (blanc opaque à 54 %) pour détacher le texte.

## 4. Préparer une photo

Toutes les photos sont normalisées en **900×1200 (3:4), WebP q82**. Les sources
Pexels allaient de 2231×3500 à 5156×7622, en portrait **comme en paysage**.

Le recadrage n'est **pas** centré : chaque photo a un point de visée `(fx, fy)`
placé à la main sur le sujet, en 0..1. Un recadrage centré coupe la tête sur les
photos en contre-plongée, et sort carrément les gens du cadre sur les 4 photos
nativement en paysage — un 3:4 tiré d'un 3:2 ne garde que **50 % de la largeur**.
Le script de génération et la table des points de visée sont dans l'historique de
la tâche ; toute nouvelle photo doit passer par la même normalisation, et le
recadrage doit être **contrôlé à l'œil**, pas supposé.

## 5. Performance

- 18 photos, **2,8 Mo au total** (les originaux pesaient 42 Mo).
- `next/image` en `fill` + `sizes="(max-width: 760px) 55vw, 30vw"`.
- Aucune `priority` : la section est sous la ligne de flottaison.
- Le `requestAnimationFrame` **ne tourne que** pendant que la section est à
  l'écran (`IntersectionObserver`), et est annulé au démontage.
- Seuls `transform` et `visibility` sont animés (jamais `scale` : les cartes
  doivent rester à taille strictement identique, cf. §0 garde-fou 2) — aucun `filter`, aucun `blur`
  (coûteux au scroll, instables sur Safari iOS).

## 6. Accessibilité

- Section reliée à son `<h2>` par `aria-labelledby`.
- Barre de progression en `aria-hidden` (décorative).
- Chaque photo porte un `alt` décrivant la scène, pas le nom de l'activité (déjà
  porté par le libellé visible).
- `prefers-reduced-motion: reduce` : **aucun pin, aucun rAF**. La classe
  `.isStatic` remet le sticky en flux et affiche les photos en grille au-dessus
  du CTA — la section reste informative, elle ne bouge plus.

## 7. État de vérification

Vérifié : `tsc --noEmit` sur tout `apps/web` et `next lint` sur `ScrollStory.tsx`
et `page.tsx` — aucune erreur, aucun avertissement. Mécanique du pin, absence de
débordement horizontal et lisibilité du CTA contrôlées au navigateur en 1440×900
et 390×844 sur une réplique reprenant le CSS module réel et les vraies photos.

Non vérifié — à contrôler en local avec `pnpm dev` :

- [ ] Rendu réel de `next/image` (la réplique simulait `fill` à la main).
- [ ] Fluidité au trackpad et à la molette sur Safari et Firefox.
- [ ] `next build` complet.
- [ ] Avec « Réduire les animations » activé : grille statique, pas de pin.
