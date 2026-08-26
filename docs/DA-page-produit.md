# DA : page Produit Linktrip

Direction artistique de `/produit`, inspirée de la page Matera « Gestion locative ».
Maquette de référence : `docs/maquette-produit-v1.html`.

## Ce qu'on reprend à Matera, ce qu'on écarte

| Principe Matera | Traduction Linktrip |
|---|---|
| Alternance de bandes pleine largeur (blanc, crème, noir, vert) | Trois sols seulement : blanc, crème `--soft`, encre `--ink`. L'encre n'apparaît que deux fois : simulateur et CTA final |
| Barre noire de chiffres sous le héros | **Écartée le 21/08/2026.** Les quatre repères étaient dits une deuxième fois ailleurs sur la page. Le héros enchaîne directement sur le parcours |
| Carte bordée à gauche du héros, panneau graphique à droite | Même découpe : carte blanche bordée avec la promesse et le champ e-mail, carte photo pleine à droite (`bouee-tractee.jpg`, seule photo paysage HD du dossier) |
| Onglets pour comprimer « Nos services sur-mesure » | Onglets **numérotés**, un par étape du parcours (quatre), **placés juste sous le héros** (arbitré le 21/08/2026). Évite de refaire les rangées alternées déjà utilisées par « Pourquoi Linktrip » sur l'accueil, et met le produit à l'écran dès le premier défilement |
| Capture posée sur un rectangle vert décalé | **Écartée le 21/08/2026.** La fenêtre produit se tient sur son seul filet : ni bloc décalé, ni ombre portée. Une capture d'application, pas une vignette |
| Tableau de prix à une colonne de coches | Tableau « Vous / Linktrip » : 1 ligne contre 7. Le déséquilibre est l'argument |
| Bande verte avant le pied de page | Dalle encre du simulateur, puis dalle encre du CTA final qui prépare le raccord avec le footer |
| Carrousel de témoignages vidéo | Carrousel des activités couvertes. Pas de témoignage tant qu'il n'y a pas de client |
| **Serif italique** sur les titres et les chiffres | **Écarté.** L'accent Linktrip reste le dégradé `--sunset` sur un mot d'Inter Tight |
| **Illustrations gravées** (clés, fauteuil, micro) | **Écartées.** Photos réelles des 18 activités et icônes maison, grille 24, stroke 1.5 |

## 1 · Layout et hiérarchie

Rythme des sols : blanc (héros), crème (le parcours), blanc (les deux modes), crème (charge de travail), blanc (démo), blanc avec la dalle encre du simulateur, blanc (activités et FAQ, en une seule bande continue, coupée par la grille de photos des activités), dalle encre du CTA final. Deux fonds clairs identiques ne se suivent jamais sans qu'une dalle ou une grille de photos vienne couper.

Rail de 1320px, gouttières 46 / 34 / 20px. Trois largeurs de contenu seulement :

- **pleine bande** pour les dalles encre et les fonds colorés ;
- **rail** pour les grilles à deux colonnes ;
- **colonne de lecture de 640 à 700px** centrée pour les chapeaux de section.

Chaque section suit la même descente : surtitre en capitales espacées, titre, une phrase, puis le visuel. Les sections à deux colonnes sont toujours dans le même sens (texte à gauche, écran à droite) sauf le héros, dont la carte de gauche porte le CTA. Pas d'alternance gauche/droite ici : elle est déjà l'écriture de la section « Pourquoi Linktrip » sur l'accueil.

## 2 · Style UI

Cartes blanches à filet 1px `--line`, rayon 20px, sans ombre. **Aucune ombre portée nulle part**, écrans produit compris : la séparation se fait au filet. Rayons : dalles 30px, cartes 20px, vignettes 14px, boutons et étiquettes 99px. Les séparateurs sont des filets, jamais des ombres ni des fonds gris.

Les dalles encre portent deux halos radiaux sunset à 20 % et 15 %, hors cadre, sans flou visible. C'est le seul effet de lumière de la page.

## 3 · Couleurs

| Rôle | Token |
|---|---|
| Sol principal | `#ffffff` |
| Sol secondaire | `--soft #fff1eb` |
| Sol tertiaire | `--paper #fbfaf9` |
| Aplat sombre | `--ink #161320` |
| Accent unique | `--sunset` (rose → orange → ambre) |
| Validation | `--ok #16a34a`, réservé aux coches et aux états « connecté » |
| Filets | `--line #ece9ef` |

Le dégradé sunset ne sert qu'à trois choses : les boutons pleins, un mot par titre, un chiffre par bandeau. Partout ailleurs le contraste vient de l'encre. `--aqua` reste anecdotique (avatars, badges).

## 4 · Typographies

Inter Tight 700/800 pour les titres, les chiffres et les boutons. Inter 400/600 pour le reste. Aucun serif, aucune italique.

| Style | Taille |
|---|---|
| H1 | `clamp(32px, 2.5vw + 0.5vh, 46px)`, interlettrage -0.02em |
| H2 | `clamp(27px, 1.9vw + 0.8vh, 42px)` |
| H3 | `clamp(20px, 0.9vw + 0.6vh, 27px)` |
| Chapeau | `clamp(15.5px, 0.4vw + 0.4vh, 18px)`, `--ink-2` |
| Corps | 15px, `--ink-3` |
| Surtitre | 12px, 800, capitales, interlettrage 0.13em, `--ink-4` |
| Chiffres | Inter Tight 800, `tabular-nums`, interlettrage -0.03em |

## 5 · Composants

- **Carte bordée** : blanc, filet, rayon 20. Le bloc de base de la page.
- **Dalle encre** : encre, rayon 30, halos sunset, texte blanc et blanc à 66 %.
- **Bouton pilule** : plein sunset **sans ombre colorée**, ou contour blanc sur fond clair, ou contour blanc à 24 % sur encre. Au survol, le fond s'éclaircit de 6 % et la flèche avance de 3px ; pas de lévitation.
- **Champ e-mail** : pilule blanche à filet, bouton sunset à l'intérieur. Sous 430px il s'empile, rayon 22.
- **Onglets numérotés** : groupe de pilules sur fond encre à 5 %, onglet actif en pilule blanche ombrée. Chaque pilule porte son numéro d'étape en Inter Tight 800 12px, gris au repos, en dégradé sunset sur l'onglet actif. Défilement horizontal sous 760px.
- **Pastille d'activité** : 34px, rayon 10, fond `--line-2`, pictogramme 19px en `--ink-2`. Sur la ligne choisie, fond blanc et trait `--brand-ink`.
- **En-tête d'étape** : numéro à `clamp(30px,2vw,40px)` en dégradé sunset, nom de l'étape en surtitre, compteur « · étape 4 sur 4 » en 12px. Même gabarit pour les quatre, sans exception.
- **Écran produit** : fenêtre blanche à filet, sans ombre. Barre de titre à trois éléments : la marque Linktrip en 18px `--ink-3`, le titre de l'écran en 12,5px 600, et à droite une étiquette de contexte en 11,5px `--ink-4`. Pas de pastilles de fenêtre macOS : c'est une application, pas une capture d'écran de bureau.
- **Format des écrans** : les quatre font exactement `534 × 429` sur grand écran, soit un rapport de 1,24. Hauteur de corps fixe (`384px`, `318px` sous 900px) et contenu centré, pour qu'aucun changement d'onglet ne fasse sauter la mise en page.
- **Carte de mode** : quatre éléments, pas un de plus. Une barre d'en-tête avec le nom du mode en Inter Tight 800 à `clamp(19px,1.1vw + 0.4vh,23px)` et sa pastille d'icône 40px ; l'écran sur fond `--paper` fermé par un filet ; une phrase ; un gain séparé par un filet, en 19px 800 avec sa précision en 13px. Les listes à puces ont été retirées : dans un bloc qui repose sur une image, trois coches par carte font écran à l'image.
- **La démonstration est dans la photo, pas dans le texte** (piste B, retenue le 26/08/2026) : les deux cartes montrent **la même photo**, en 3/2, plein cadre, sans écran simulé. À gauche elle est floutée en dur dans le fichier (`MODEB_BLUR`, gaussienne 8), voilée à 8 %, couverte du filigrane et barrée d'un cadenas de 64px ; à droite elle est nette. Une seule image, deux issues.
- **Le nom du mode vit sur la photo**, en blanc, avec sa pastille d'icône en verre (`rgba(255,255,255,.16)` + `backdrop-filter`). Un dégradé bas à 64 % le porte : il ne sert qu'à ça. La couleur de marque descend alors sur le gain, en bas de la bande blanche — **une seule tache orange par carte**, jamais deux.
- **La bande blanche porte trois niveaux** : la phrase en 16px/600 encre, le détail en 14,5px `--ink-3`, le gain séparé d'un filet. C'est le seul endroit de la page où le droit à l'image et la demande d'avis sont encore écrits.
- **Presque aucune couleur ne distingue les deux modes** : la pastille du mode boutique est en `--soft` avec un trait `--brand-ink`, celle du mode marketing reste neutre, et seul le gain du mode boutique passe en `--brand-ink`. Un dégradé sur trois mots ne montre que le début de la rampe et vire au rose : sur un texte court, le sunset devient une couleur pleine.
- **Carte activité** : photo en 4/3, voile bas, nom en Inter Tight 800, étiquette de mode en haut à gauche.
- **Accordéon FAQ** : filet bas, `+` qui pivote en `×`.
- **Déclencheur de la démo** : le même composant que l'accueil (`components/marketing/DemoArcade.tsx`). Trois vignettes verticales 3/4 se recouvrent, inclinées de −5°, 0° (mise à l'échelle 1,1 et au premier plan) et +5°, chacune portée par une ombre longue et basse. Au centre, un disque blanc opaque avec le triangle de lecture en encre ; il grossit légèrement au survol et l'ensemble du trio se resserre. La durée, « 1 min 40 », est posée en micro-typographie sous le trio, pas en pastille sur l'image. Aucun cadre 16/9, aucune capture d'interface : la démo elle-même s'ouvre en plein écran.
- **Pied de page** : barre unique, filet haut, logo + liens + mention de copyright. Tient lieu du composant `Footer` existant pour que la maquette ne s'arrête pas net après le CTA.

## 6 · Illustrations et visuels

Aucune illustration décorative. Trois sources d'images uniquement :

1. **Les photos réelles** de `public/landing/immersive` (18 activités), recadrées, jamais détourées.
2. **Les écrans du produit**, recopiés du code (`sorties`, `revenus`, `ReglagesForm`, `g/[token]`), pas redessinés.
3. **Les icônes maison**, grille 24×24, stroke 1.5, `currentColor`, même famille que `ActivityIcons.tsx`.

**Les activités se disent par leur pictogramme, pas par leur nom.** Dans la liste des sorties de l'étape 01, chaque ligne porte la pastille de son activité (34px, fond `--line-2`, trait `--ink-2`) à la place du texte : c'est ce qui rend la liste scannable et ce qui fait exister le jeu d'icônes comme une famille de logos. Le nom réapparaît dans le champ « Activité » du formulaire, parce qu'on choisit par le nom et qu'on scanne par l'icône. Chaque pictogramme porte un `<title>` et un `aria-label` : l'information ne doit pas dépendre de la vue. Conséquence de vocabulaire : les activités montrées se limitent à celles qui ont un pictogramme dessiné (« Via ferrata » est devenue « Rafting »). Ne jamais improviser une icône hors grille pour combler un manque.

L'étape « La protection » est la seule image traitée de la page : l'aperçu flouté et filigrané s'y lève sur le fichier original. C'est un argument, pas un ornement.

## 7 · Animations

### Mouvements de page

- **Révélation au défilement** : opacité 0 → 1 et 16px de remontée, 600ms, décalage de 60ms par groupe de quatre.
- **Onglets** : le panneau entre en 340ms avec 12px de remontée, la pilule active glisse.
- **Compteur** : `CountUp` sur le total du simulateur, au premier passage seulement.
- **Boutons** : -1px vertical, ombre renforcée, flèche +3px.
- **Cartes activité** : photo à 1.05 en 450ms.
- Pas de parallaxe : `ScrollStory` la porte déjà sur l'accueil.
- `prefers-reduced-motion` neutralise tout, y compris le défilement doux.

### Scènes animées des étapes

Chaque étape du parcours a sa propre scène : l'écran de droite ne montre pas un résultat, il joue l'action. Depuis la suppression de « La relance » et du « Versement » le 21/08/2026, le parcours compte quatre étapes et **les quatre scènes sont faites**.

**Règles communes**

1. **Une seule horloge.** Toutes les animations d'une scène durent 11s et bouclent ensemble. Les décalages **courts** (jusqu'à ~400ms) passent par `animation-delay`, constant d'un tour à l'autre. Les décalages **longs** ont leurs propres keyframes : au-delà, la sortie de l'élément déborde sur le tour suivant et il reste affiché pendant la remise à zéro. Aucune animation n'a sa propre durée.
2. **Une seule scène tourne à la fois.** Le contrôleur (`window.__scenes`) démarre la scène de l'onglet actif et arrête les autres. Un `IntersectionObserver` à 25 % coupe tout quand la section sort de l'écran, `visibilitychange` coupe quand l'onglet du navigateur passe à l'arrière-plan.
3. **Redémarrage propre.** Au changement d'onglet, la classe `.play` est retirée, un reflow est forcé, puis elle est remise : la scène repart de zéro plutôt que de reprendre au milieu.
4. **Le repos est l'état final.** En `prefers-reduced-motion`, la scène affiche directement l'état d'arrivée, celui qui porte l'information. Jamais un écran vide.
5. **Pas de librairie.** Keyframes CSS et un compteur en `requestAnimationFrame`. Rien à charger, et le tout se transpose tel quel en composant React.
6. **Timing.** `cubic-bezier(.4,0,.2,1)` partout, un seul rebond nulle part. La vitesse vient des décalages courts (70 à 190ms), pas des durées.

**Étape 01 · La sortie** — timeline en pourcentages du cycle de 11s :

| Repère | Ce qui se passe |
|---|---|
| 0 à 6 % | La liste est vide, la pastille de synchronisation clignote |
| 6 à 26 % | Trois sorties arrivent de la plateforme de réservation, décalées de 160ms |
| 16 à 56 % | La zone de création à la main est là dès le départ ; ses trois champs se remplissent l'un après l'autre (date, activité, heure), chacun précédé d'un filet de marque qui passe puis s'éteint |
| 53 à 58 % | Le bouton « Créer » se gonfle de 6 % |
| 58 à 64 % | La sortie créée rejoint la liste, avec son étiquette « Créée à la main » |
| 66 à 76 % | L'opérateur en choisit une : filet et fond de marque, puis la coche |
| 76 à 90 % | Maintien |
| 90 à 96 % | Retour à l'état de départ |

**Étape 02 · Le dépôt** — timeline en pourcentages du cycle de 11s :

| Repère | Ce qui se passe |
|---|---|
| 0 à 7 % | La zone de dépôt attend, filet pointillé au repos, pastille d'icône au centre |
| 7 à 21 % | Une pile de trois photos et un curseur entrent par le haut à droite, en biais, et se posent. La zone passe en état actif (filet `--brand`, fond `--soft`) |
| 21 à 26 % | Lâcher : la zone s'enfonce de 1,5 %, la pile disparaît sous le curseur |
| 25 à 52 % | Téléversement : la barre se remplit, le compteur monte de 0 à 42, et dix-huit vignettes se substituent une à une à leurs plaques grises (décalage de 128ms) |
| 52 à 73 % | Les trois créneaux se remplissent l'un après l'autre, vignettes en cascade de 60ms, badges « Publié » qui apparaissent en 1.07 puis reviennent à 1 |
| 72 à 93 % | Maintien sur l'état final |
| 93 à 100 % | Retour à la zone de dépôt |

**Étape 03 · La protection** — timeline en pourcentages du cycle de 11s :

| Repère | Ce qui se passe |
|---|---|
| 0 à 24 % | L'aperçu protégé : photo floutée, filigrane de marque en diagonale, **cadenas fermé au centre**, barre « Aperçu protégé · Pack complet · 24 € » et bouton « Payer » |
| 19 à 24 % | Le bouton se gonfle de 7 % : le paiement part |
| 25 à 29 % | **Le cadenas s'ouvre** : l'anse pivote de 40° et se soulève de 2px, le disque respire de 6 % |
| 30 à 36 % | Le cadenas s'efface, juste avant le balayage |
| 25 à 50 % | La barre passe à « Paiement confirmé · 24,00 € », coche verte |
| 30 à 52 % | **Le balayage** : `clip-path` lève la couche protégée de gauche à droite, un filet sunset de 2px le suit et s'éteint à l'arrivée |
| 46 à 52 % | L'étiquette de la barre de titre passe de « Aperçu protégé » à « Fichier livré » |
| 57 à 90 % | Barre « Fichier original livré · 4000 × 3000 · JPEG », maintien sur la photo nette |
| 88 à 96 % | Balayage inverse, retour à l'aperçu protégé |

Le flou n'est pas une image pré-calculée mais un `filter: blur(9px)` sur la même photo : une seule ressource, et le contraste net / flou reste exact au pixel près.

**Le filigrane** porte la marque complète, symbole et mot, en lignes décalées d'une demi-cellule plutôt qu'en grille régulière — un quadrillage parfait fait tampon d'essai, un décalage fait filigrane. Blanc à 40 % avec une ombre portée très courte (`0 1px 2px` à 40 %) : sans elle, il disparaît sur les zones claires de la photo. Il est construit en `<span>` dans le DOM et non en motif SVG de fond, parce qu'une image de fond ne peut pas charger Inter Tight et retomberait sur la typo du système.

**Le cadenas** est la seule surcouche tolérée sur la photo : il dit l'état, et son ouverture est le pivot de la scène. Disque de 74px à 50 % d'encre avec flou d'arrière-plan, anse animée séparément (`transform-box: fill-box`). L'icône de la barre du bas est passée à un œil pour ne pas répéter deux fois le même symbole.

**Étape 04 · La boutique** — timeline en pourcentages du cycle de 11s :

| Repère | Ce qui se passe |
|---|---|
| 0 à 8 % | Les réglages au repos, étiquette « Brouillon » dans la barre de titre |
| 10 à 17 % | Le mode de vente bascule de « Photo seule » à « Toutes les photos », la pastille du segment glisse |
| 18 à 33 % | Les deux prix montent de 0 à 6,00 € et 24,00 € |
| 24 à 34 % | La part de l'opérateur monte à 80 %, et la barre de répartition se remplit sous la ligne |
| 38 à 45 % | Le compte de versement passe de « Connexion en attente » à « Stripe connecté » |
| 44 à 51 % | L'étiquette de la barre de titre passe de « Brouillon » à « En ligne » |
| 56 à 88 % | Une première vente tombe en bas de l'écran : « Nouvelle vente · Claire L. · pack complet · 24,00 € » |
| 88 à 96 % | Retour à l'état de départ |

Les compteurs de cette scène ne sont pas écrits en dur : tout élément portant `data-count` monte de `data-from` à `data-to` entre `data-start` et `data-end`, exprimés en fraction du cycle. Le même mécanisme sert au compteur de photos de l'étape 02 et servira aux scènes suivantes.

## 8 · Finitions

Le détail qui fait la différence entre une maquette et une page livrée.

- **Zéro ombre décorative.** Boutons, onglets, cartes, segments : tous à plat, la séparation vient du filet. Deux exceptions justifiées : le trio de la démo, dont chaque vignette porte une ombre longue et basse parce qu'elle est censée être posée sur la page, et la pile de photos tirée dans la scène 02, parce qu'un objet en cours de déplacement doit flotter.
- **Titres en `text-wrap: balance`, chapeaux en `text-wrap: pretty`.** Plus aucun mot orphelin en fin de titre, à toutes les largeurs.
- **Un seul anneau de focus** pour toute la page : `:focus-visible` en 2px `--brand`, décalé de 3px. Visible au clavier, invisible à la souris.
- **`scroll-margin-top: 96px` sur tout élément à identifiant**, pour que l'en-tête collant ne recouvre jamais la cible d'une ancre.
- **`::selection`** en teinte de marque à 18 %.
- **`user-select: none` sur la barre d'onglets**, qui se manipule et ne se lit pas.
- **Colonne « Vous » centrée verticalement** dans le tableau du partage du travail : le vide devient symétrique, donc lisible comme une intention et non comme un oubli.
- **États de repos vérifiés en `prefers-reduced-motion`** pour les deux scènes animées, y compris la mise en avant de la ligne choisie à l'étape 01. Une scène sans mouvement doit rester informative.

## 9 · Responsive

| Palier | Comportement |
|---|---|
| ≥ 1100px | Deux colonnes partout, 6 onglets alignés, 6 cartes activité de front |
| 900 à 1100px | Activités en carrousel à défilement magnétique |
| 760 à 900px | Piliers et simulateur en une colonne, écran produit sous le texte |
| ≤ 760px | Onglets en défilement horizontal, tableau « Vous / Linktrip » empilé |
| ≤ 520px | Gouttières à 20px, H1 à 32px, champ e-mail empilé, CTA d'en-tête raccourci à « Rejoindre » |

Toutes les pistes de grille sont en `minmax(0,1fr)` : sans cela le héros déborde de 60px sur iPhone. Les conteneurs à défilement horizontal (onglets, activités) ne débordent jamais la page.

## Points à trancher

- **Sections Tarif et Cadre légal supprimées le 26/08/2026.** La page ne dit plus le prix autrement que par la FAQ (« Combien coûte Linktrip ? », 20 % de commission, sans abonnement), par la mention « Estimation, commission déduite » du simulateur et par la micro-copie du héros. Le droit à l'image et le RGPD ne sont plus dits qu'en une ligne du tableau du partage du travail (« Supprime tout au bout de 90 jours ») : consentement, hébergement en Europe et effacement à la demande ont quitté la page. Le CSS `.price` et `.legal` a été retiré de la feuille.

- Le panneau du héros est une photo pleine **coupée en deux** (26/08/2026) : la moitié droite est la même image, floutée en dur dans le fichier (`HERO_BLUR`, gaussienne 15 sur le rendu 1300×1000, jamais un `filter` CSS sur un élément découpé, dont le flou baverait sur la coupe), voilée d'encre à 22 % et couverte du filigrane `.scWm` de l'étape 03, **repris en plus lisible** : blanc à 72 % au lieu de 40 %, corps `clamp(12.5px,1.05vw,16px)`, gouttières élargies. Sur le héros le filigrane est un argument, dans l'étape 03 c'est une texture — les deux réglages ne se confondent pas. La couleur passe par le CSS, qui l'emporte sur les attributs `stroke` et `fill` du SVG. La coupe est un `clip-path:inset(0 0 0 50%)` net, doublée d'un filet blanc à 42 %. Le cadenas fermé, disque encre à 50 % avec `backdrop-filter`, est centré sur la coupe : sa moitié gauche mord sur la photo claire. Un dégradé sombre de 24 % sur le bas donne du corps à l'ensemble contre le blanc. Seule `bouee-tractee.jpg` est en paysage HD ; les 18 photos de `immersive/` sont en portrait 900x1200 et ramollissent une fois recadrées ici.
- « Votre marque » n'est pas dans la maquette : ce n'est pas une étape du parcours, l'ajouter en septième onglet casserait la logique de la barre. À placer ailleurs sur la page si tu y tiens.
- Le bloc démo appelle la vraie démo Arcade (`bPkIR0jKiJ7fvxzUNK0e`, même identifiant que l'accueil) : la maquette a besoin du réseau pour l'ouvrir. Au moment de l'intégration React, remplacer le trio et le script recopiés par le composant `DemoArcade` lui-même. Le CSS de l'ancienne affiche (`.demo__poster`) et l'image `POSTER` sont morts.
- Les quatre scènes du parcours sont faites. Le CSS des écrans « relance » et « revenus » (`.auto`, `.tog`, `.bal`, `.saleRow`) reste dans la feuille : il est mort depuis la suppression des deux étapes, à nettoyer au moment de l'intégration React.
- L'étape « La galerie » a été supprimée le 21/08/2026 : l'argument « un lien privé, aucun compte à créer » n'est plus porté par le parcours.
- L'étape 01 annonce une connexion aux plateformes de réservation qui n'est pas encore codée. Aucun nom d'éditeur n'est affiché dans la maquette, seulement « Réservations » : à trancher au moment de l'intégration.
