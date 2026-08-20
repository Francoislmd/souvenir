# SPEC — Section « types d'activités » (bandeau défilant)

Composants : `apps/web/components/marketing/ActivityMarquee.tsx`,
`ActivityIcons.tsx`, `ActivityMarquee.module.css`.

## 0. Intention

Reprendre les codes visuels d'une bande de logos clients SaaS — monochrome,
fondu latéral, beaucoup de blanc, alignement strict — pour communiquer
**la diversité des métiers couverts** et la spécialisation outdoor de Linktrip,
sans clients à afficher.

**Garde-fou, non négociable.** Le seul risque de cette section est qu'elle se
lise comme un mur de clients. Trois règles :

1. Le sur-titre contient un verbe de **capacité** (« conçu pour », « compatible
   avec », « prend en charge »), jamais de possession (« ils nous font
   confiance », « utilisé par », « rejoignez »).
2. Aucun chiffre implicite (« +200 opérateurs », « 12 activités »).
3. La note de bas de section (« Vous ne trouvez pas votre activité ? ») est ce
   qui lève définitivement l'ambiguïté. Ne pas la supprimer.

## 1. Montage

Server Component, aucune directive `"use client"` : l'animation est 100 % CSS,
il n'y a rien à hydrater. Aucune dépendance ajoutée (pas de librairie d'icônes,
pas de `framer-motion`, pas de `react-fast-marquee`).

```tsx
import { ActivityMarquee } from "@/components/marketing/ActivityMarquee";
```

### Montage retenu sur l'accueil

Monté dans `app/(marketing)/page.tsx` en **frère de `.rail`**, entre `.rail` et
`<Footer />` — pas en enfant.

`landing.module.css` §0 pose que le contenu principal tient sur `100svh` et que
seul le pied de page vit sous la ligne de flottaison. `.rail` porte lui-même son
plancher `min-height: 100svh` et `.main` est en `flex: 1`. Ajouter le bandeau
**dans** `.rail` l'aurait fait concourir avec le hero pour ce même écran : sur un
viewport court, le hero se serait comprimé.

En frère, `.rail` garde son écran entier, et le bandeau vit sous la ligne de
flottaison avec le pied de page. La landing devient une page à 2 écrans — c'est
le comportement standard d'une landing SaaS, et le hero n'est pas touché.

### Le prop `bleed`

`--gutter` est déclaré sur `.page`, donc hérité aussi bien par `.rail` que par
ses frères. Mais seul `.rail` l'applique en `padding` :

- **Frère de `.rail`** (cas de l'accueil) → la section est déjà pleine largeur.
  `bleed={false}` (défaut). Les blocs de texte portent la gouttière via
  `px-[var(--gutter,20px)]`, le bandeau va d'un bord à l'autre.
- **Enfant de `.rail`** (autre page, autre gabarit) → passer `bleed` pour que le
  bandeau ressorte des gouttières par marge négative.

Mettre `bleed` dans le premier cas créerait un défilement horizontal.

## 2. Mécanique de la boucle

La piste contient `REPEAT = 2` copies identiques de la liste et se translate de
`-50 %`, soit exactement une copie : au redémarrage du keyframe, la seconde
copie occupe la position de départ de la première. La jointure est invisible.

**Contrainte de largeur.** Une copie doit être plus large que le viewport, sinon
un blanc traverse le bandeau. 12 activités ≈ 2 400 px, confortable. Sous 10
activités : passer `REPEAT` à `3` **et** `translate3d(-50%)` à `-33.333%`.

**Vitesse.** ≈ 3,8 s par activité. 12 → `durationSec = 46`. Si la liste change,
recalculer pour conserver la même vitesse perçue.

## 3. Tokens utilisés

| Rôle | Token | Valeur |
|---|---|---|
| Sur-titre | `text-ink-3` | `#726c80` |
| Titre H2 | `text-ink` + `font-display` | `#161320` |
| Picto + label au repos | `text-ink-4` | `#a6a0b2` |
| Picto + label au survol | `text-ink-2` | `#413c4e` |
| Point séparateur | `bg-line` | `#ece9ef` |

Aucun aplat coloré, et **pas de `--brand` sur les pictogrammes** : la couleur de
marque casserait l'effet mur de logos. Le seul accent autorisé est le lien
« Parlons-en ».

## 4. Métriques

| Zone | Valeur |
|---|---|
| Padding vertical de section | `clamp(56px, 7vh, 96px)` |
| Titre → bandeau, bandeau → note | `clamp(32px, 4.4vh, 56px)` |
| Gap horizontal entre activités | 56 px (`px-7` de part et d'autre) |
| Gap picto ↔ label | 11 px |
| Pictogramme | grille 24×24, rendu 26 px, `stroke-width: 1.5` |
| Fondu latéral | 10 % de la largeur de chaque côté |
| Label | 15 px / 600 / `-0.012em` |
| Sur-titre | 13 px / 600 / `+.12em` / MAJ |

Le titre est plafonné à `22ch` : au-delà la ligne s'allonge et la section perd
son registre institutionnel.

## 5. Pictogrammes

14 disponibles dans `ActivityIcons.tsx` : `rafting`, `canyoning`, `kayak`,
`jet-ski`, `paddle`, `surf`, `tyrolienne`, `quad`, `parapente`, `helicoptere`,
`plongee`, `parc-aventure`, `ski-nautique`, `bouee`.

Les 6 activités ayant déjà une route sous `app/(marketing)/activites/`
(canyoning, parapente, parc-aventure, plongée, rafting, surf) ont toutes leur
pictogramme — un maillage interne depuis le bandeau est possible plus tard, mais
il est volontairement absent : une cible de clic en mouvement est une mauvaise
cible de clic.

**Règle de dessin.** Grille 24×24, `stroke-width: 1.5`, `fill: none`,
`stroke: currentColor`, extrémités et jointures arrondies. L'épaisseur de trait
constante est le seul élément qui fait tenir l'ensemble comme un jeu cohérent —
ne jamais mixer deux épaisseurs. Les activités nautiques partagent la même
constante `WAVE` : ce motif récurrent crée l'air de famille.

## 6. Accessibilité

- Section reliée à son titre par `aria-labelledby`.
- SVG en `aria-hidden` + `focusable="false"`.
- La seconde copie de la liste porte `aria-hidden` : chaque activité n'est
  annoncée qu'une fois.
- `prefers-reduced-motion: reduce` remplace le défilement par une grille statique
  centrée multi-lignes, sans masque (il abaisse le contraste des items de bord)
  et sans la copie fantôme.
- La pause au survol est sous `@media (hover: hover)` pour ne pas créer d'état
  figé après un tap sur mobile.

## 7. État de vérification

Vérifié : `tsc --noEmit` sur tout `apps/web` et `next lint` sur `page.tsx`,
`ActivityMarquee.tsx`, `ActivityIcons.tsx` — aucune erreur, aucun avertissement.

Non vérifié : le rendu visuel et le `next build` complet. À contrôler en local
avec `pnpm dev` :

- [ ] Le hero occupe toujours exactement le premier écran, non comprimé.
- [ ] Aucun défilement horizontal sur la page, notamment en 375 px.
- [ ] La boucle est continue : aucun blanc ne traverse le bandeau, aucun saut à
      la jointure.
- [ ] Le défilement se met en pause au survol.
- [ ] Avec « Réduire les animations » activé dans l'OS : grille statique centrée
      multi-lignes, pas de doublon.
- [ ] Le bandeau ne se retrouve pas sous un halo (`.auraCool` est ancré en haut,
      il ne devrait pas descendre jusque-là).
