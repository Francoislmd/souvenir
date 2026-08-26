# SPEC : Page Produit Linktrip (`/produit`)

Étape 1 : structure et wording. Le design fait l'objet d'une seconde passe.

## Le lecteur, avant le produit

*Refonte complète du wording le 26/08/2026 : « prends du recul, mets-toi à la place d'un humain qui arrive sur la page ».*

**Qui arrive.** Un moniteur ou un gérant de petite structure : canyoning, rafting, parapente, parc aventure, plongée. Il lit la page sur son téléphone entre deux groupes, ou à 21 h après une journée dehors.

**Ce qu'il vit déjà.** Il prend des photos. Elles finissent sur une carte SD, dans un WeTransfer envoyé le dimanche soir, ou nulle part. Ses clients lui demandent « vous avez les photos ? » et il répond « je vous envoie ça ». Il n'attend pas un logiciel de vente de photos : il a le sentiment diffus qu'il y a de l'argent et de la reconnaissance qui dorment sur cette carte.

**Ce qu'il craint.** Un outil de plus à gérer. Du temps qu'il n'a pas en pleine saison. Avoir l'air de faire payer des gens avec qui il vient de passer la journée. Une histoire de droit à l'image. Un abonnement qu'il oubliera de résilier en octobre.

**Ce qu'il veut savoir, dans cet ordre.** C'est quoi, concrètement ? Qu'est-ce que j'ai à faire, moi ? Comment ça se passe pour mon client ? Combien ça rapporte, combien ça coûte ? Et le droit à l'image ?

**Ce qui n'allait pas dans la version précédente.** Elle était écrite du point de vue du produit, habillée en langage de bénéfices. Le vocabulaire était le nôtre, pas le sien : « boutique », « le parcours », « mode boutique / mode marketing », « encaissement », « projection », « votre charge de travail ». Personne ne se décrit comme étant « en mode marketing ». Et le moment qui fait tout le produit — le groupe qui sort de l'eau et demande les photos — n'était écrit nulle part. Le résultat était juste, précis, et complètement froid.

**La phrase qui tient la page** : *les photos que vous prenez déjà cessent d'être une corvée et se mettent à valoir quelque chose.*

## Cadrage retenu

- **Audience** : l'opérateur, du début à la fin. Le client final n'apparaît jamais comme cible, seulement comme preuve (« voilà ce qu'il reçoit »).
- **Périmètre** : `/produit` devient la page pilier et absorbe `/fonctionnement` (démo Arcade) et `/simulation` (simulateur de revenus). Les deux URL passent en redirection permanente.
- **CTA unique** : liste d'attente, champ e-mail (`EmailCaptureField`), répété 4 fois sur la page.
- **Règle de contenu** : rien qui n'existe pas dans le code. Pas de vidéo, pas de téléchargement zip groupé, pas d'application mobile.
- **Exception assumée** : l'étape 01 annonce la connexion à une plateforme de réservation. Elle n'existe pas encore dans le repo (seule la création manuelle est codée, `sorties/nouvelle`). À tenir hors ligne tant que l'intégration n'est pas livrée, ou à formuler au futur.

### Conséquences techniques à prévoir

| Sujet | Action |
|---|---|
| `Header.tsx` | `MarketingRoute` devient `"produit" \| "liste-attente"`, `NAV_LINKS` se réduit à `Produit` |
| `next.config.mjs` | redirections 301 `/fonctionnement` → `/produit#demo`, `/simulation` → `/produit#simulateur` |
| `app/sitemap.ts` | remplacer les deux entrées par `/produit` |
| Composants | `DemoArcade`, `RevenueSlider`, `Faq`, `EmailCaptureField` sont réutilisés tels quels. `ArcadeEmbed` (le cadre 16/9 de `/fonctionnement`) n'est plus utilisé par `/produit` |

---

## Ordre des sections

| # | Section | Ancre | Rôle dans le tunnel |
|---|---|---|---|
| 1 | Hero produit | aucune | Promesse + capture |
| 2 | Le parcours, en quatre étapes | `#fonctionnalites` | Montrer le produit tout de suite, comme un enchaînement |
| 3 | Les deux modes | `#modes` | Élargir la cible : Linktrip sert aussi ceux qui ne veulent pas vendre |
| 4 | Le partage du travail | `#charge` | Le vrai argument : ce n'est pas un outil de plus à gérer |
| 5 | Démo | `#demo` | Preuve en mouvement, une fois la promesse posée |
| 6 | Simulateur | `#simulateur` | Projection chiffrée personnelle |
| 7 | Activités couvertes | aucune | Reconnaissance de soi + maillage SEO |
| 8 | FAQ | `#faq` | Objections résiduelles |
| 9 | CTA final | aucune | Conversion |

**Logique de l'ordre** : promesse → ce que fait le produit → les deux façons de s'en servir → soulagement (charge de travail) → preuve en mouvement → projection → « c'est pour moi » → doutes → action. Les fonctionnalités remontent juste sous le héros (arbitré le 21/08/2026) : un visiteur qui arrive sur une page « Produit » veut voir le produit tout de suite, pas un préambule. La charge de travail vient ensuite en dire la conséquence, et la démo confirme le tout en mouvement. Le simulateur reste après : un chiffre n'a de valeur que si le visiteur croit déjà que le produit marche.

---

## 1. Hero produit

**Objectif** : Dire en une phrase ce qu'est le produit, et capter l'e-mail des visiteurs déjà convaincus par l'accueil.

**Contenu** : Titre, sous-titre, champ e-mail, mention rassurante, lien d'ancre vers la démo. Visuel : une photo d'activité pleine, **coupée en deux dans le sens vertical** (arbitré le 26/08/2026) : à gauche la photo livrée, à droite la même photo telle que la voit un client qui n'a pas encore payé, floutée sous le filigrane LINKTRIP répété. Le cadenas est posé au milieu, à cheval sur la coupe, une moitié sur chaque côté.

Le héros dit donc la protection sans une ligne de texte, et rattrape en partie ce que la suppression du cadre légal a emporté. C'est aussi le seul endroit de la page, avec l'étape 03, où l'argument du droit à l'image existe encore visuellement.

**Wording**

- Surtitre : `Le produit`
- H1 : **Les photos de vos sorties, enfin réglées.** (accent dégradé `--sunset` sur « enfin réglées »)
- Puces, dans l'ordre de la journée : **Le soir, vous videz votre carte mémoire.** Les photos se rangent seules, par créneau. · **Chaque client reçoit un lien avec ses photos.** Sans compte, sans application, sans mot de passe. · **Ceux qui veulent les garder paient.** L'argent arrive sur votre compte, jamais sur le nôtre.
- CTA : champ e-mail + `Rejoindre la liste d'attente →`
- Micro sous le champ : `Sans abonnement · Sans engagement · Sans matériel`
- Lien secondaire : `Voir le parcours ↓`

---

## 2. Le parcours, en quatre étapes

**Objectif** : Montrer le produit tout de suite, et le montrer comme un enchaînement plutôt que comme une liste de fonctions. Chaque étape suit le même gabarit : numéro, nom de l'étape, titre, une phrase, un vrai écran du produit.

**Contenu** : Quatre onglets numérotés, un panneau visible à la fois, texte à gauche et écran à droite. Les écrans sont recopiés du code réel (`app/(operator)/sorties`, `app/(operator)/revenus`, `components/reglages/ReglagesForm.tsx`, `app/g/[token]`), pas inventés. Toutes les étapes ont le même en-tête : numéro, nom, compteur.

**Wording**

- Surtitre : `Comment ça marche`
- H2 : **Ce qui se passe après la sortie.**
- Sous-titre : Quatre étapes. Vous n'intervenez que dans la deuxième.

| # | Onglet | Titre du panneau | Phrase | Écran |
|---|---|---|---|---|
| 01 | La sortie | **Vos sorties, sans les ressaisir.** | Connectez votre plateforme de réservation : les sorties et leurs créneaux se créent seuls. Sans plateforme, trois champs suffisent : la date, l'activité, l'heure. | Liste des sorties de la semaine, avec la source de chacune |
| 02 | Les photos | **Vos photos, déposées en une fois.** | Glissez le contenu de votre carte mémoire. Chaque photo rejoint son créneau grâce à son heure de prise de vue. | Page d'une sortie, photos groupées par créneau |
| 03 | Le client | **Rien ne sort avant le paiement.** | Seuls des aperçus floutés et filigranés circulent. Le fichier original n'est délivré qu'une fois le paiement confirmé. | La photo du client : l'aperçu protégé, le paiement, le filigrane qui se lève |
| 04 | Le paiement | **Vous fixez les prix, la boutique ouvre.** | Le prix de la photo seule, celui du pack complet, et la boutique de la sortie ouvre avec la galerie. Les paiements sont encaissés sur votre compte Stripe. | Réglages de la boutique : mode de vente, prix, répartition, compte de versement, première vente |

> **Étapes « La relance » et « Le versement » supprimées le 21/08/2026.** Deux arguments quittent le parcours avec elles :
> - **Les relances automatiques**, c'est-à-dire le seul mécanisme qui augmente réellement le chiffre (« le lendemain, on leur propose leurs photos à prix réduit, c'est ce qui rapporte le plus »). Il ne reste plus que la ligne « Relance les clients qui n'ont pas acheté » du tableau du partage du travail.
> - **Le versement hebdomadaire** et le tableau de bord des revenus. La promesse « l'argent arrive sur votre compte » ne tient plus que par la puce du héros et par la ligne « Stripe connecté » de la boutique.
>
> Le parcours s'arrête donc à la première vente. Si ces deux arguments doivent rester sur la page, il leur faut une autre place que le parcours.

> **Étape « La galerie » supprimée le 21/08/2026.** Elle disait « un lien privé, aucun compte à créer » et montrait la galerie sur téléphone. Cet argument n'est plus porté par le parcours : il reste dans la FAQ (« Comment mes clients accèdent-ils à leurs photos ? ») et dans le tableau du partage du travail (« Envoie le lien privé par e-mail ou WhatsApp »). À remettre quelque part si tu le juges structurant : c'est le seul endroit qui disait que le client n'a pas de compte à créer.

> **Étape optionnelle, à trancher** : *Votre marque* : « Votre nom, pas le nôtre. Votre logo et le nom de votre structure apparaissent sur la galerie et dans les e-mails envoyés à vos clients. » C'est vrai (upload de logo dans les réglages) mais ce n'est pas une étape du parcours, ce qui casserait la logique de la barre. À placer plutôt ailleurs sur la page.

---

> **Bandeau de repères supprimé le 21/08/2026.** Les quatre chiffres étaient alors redits par les sections Tarif et Cadre légal, supprimées depuis. Il ne reste que la FAQ : `0 €`, `20 %` et l'absence de matériel y sont dits, `90 j` par la ligne du tableau du partage du travail. La page passe du héros directement aux fonctionnalités.

## 3. Les deux modes

**Objectif** : Élargir la cible. Le parcours qui précède ne parle que de vendre ; or beaucoup d'opérateurs offrent déjà leurs photos et n'ont aucune intention de les facturer. Cette section leur dit que le produit est aussi pour eux, sans affaiblir la promesse de revenu.

**Contenu** (piste B, retenue le 26/08/2026) : Deux cartes strictement symétriques, **sans écran simulé**. La photo occupe le haut de la carte, le nom du mode vit dessus en blanc avec sa pastille d'icône, et **tout le texte descend sur une bande blanche**. La même photo dans les deux cartes : à gauche protégée — floutée, filigranée, cadenassée, pastille « 24 € les 12 photos » — à droite livrée nette, pastille « Offert ». Une seule image, deux issues.

Sous la photo, trois niveaux : la phrase qui dit le mode, **un paragraphe de détail**, puis le gain séparé par un filet.

**Le paragraphe de détail est le seul endroit de la page où le droit à l'image et la demande d'avis sont encore dits en toutes lettres** — ils avaient disparu avec les coches du 21/08 et avec la section Cadre légal du 26/08.

**Plus de commission dans ce bloc** (« arrête de mettre partout 20 % prélevé ») : les deux gains parlent de ce que ça rapporte, pas de ce que ça coûte. Le taux n'est plus dit que par la FAQ.

**Wording**

- Surtitre : `Deux façons de s'en servir`
- H2 : **Vendez vos photos. Ou offrez-les.**
- Sous-titre : Le choix se fait une fois, dans vos réglages. Il vaut ensuite pour toutes vos sorties.

| | Mode boutique | Mode marketing |
|---|---|---|
| Photo | La même photo, protégée : floutée, filigranée, cadenassée, pastille « 24 € les 12 photos » en sunset | La même photo, livrée nette, pastille « Offert » en encre |
| Phrase | Le client paie ses photos, au prix que vous avez fixé. | Les photos sont offertes, contre un e-mail et un avis. |
| Détail | Vous fixez le prix de la photo seule et celui du pack complet. Le client paie par carte depuis sa galerie, et les fonds arrivent sur votre compte : Linktrip ne les détient à aucun moment. | Le client laisse son adresse et accepte le droit à l'image avant de recevoir ses photos. La demande d'avis part dans la foulée, au moment où il vient de revivre sa sortie. |
| Ce que ça rapporte | **Un revenu complémentaire** · Sur des sorties que vous photographiez déjà | **Des avis et des contacts** · Sans rien facturer à vos clients |

> **Ce que la simplification a coûté** (21/08/2026, « il y a trop d'information visuellement ») : les trois points cochés par carte ont sauté — prix à l'unité et pack, paiement par carte, versement sur le compte d'un côté ; galerie gratuite, e-mails consentis, demande d'avis de l'autre. Le paiement et le versement sont déjà dits par l'étape 04 du parcours et par la section Tarif. **En revanche, le consentement au droit à l'image et la demande d'avis du mode marketing ne sont plus dits nulle part ailleurs sur la page** : la phrase « contre un e-mail et un avis » est tout ce qu'il en reste.

> **Attention périmètre** : le mode marketing **n'existe pas dans le code**. Le schéma ne connaît que `SortieMode INDIVIDUEL | GROUPE`, et la galerie est toujours payante (`Order.status === "succeeded"` conditionne l'accès aux fichiers). Il faudrait au minimum : un réglage de compte, une galerie sans paiement, et le déclenchement de la demande d'avis sur le téléchargement plutôt que sur l'achat.

> **Conséquence sur le tarif** : en mode marketing il n'y a aucune vente, donc aucune commission. La section Tarif dit « vous ne payez que si vous vendez », ce qui reste vrai — mais le modèle économique de Linktrip repose entièrement sur les opérateurs en mode boutique. À surveiller si le mode marketing prend.

---

## 4. Le partage du travail

**Objectif** : Section la plus importante de la page. Le produit ne se vend pas sur ses fonctions mais sur ce qu'il retire de la journée d'un moniteur. L'argument est visuel : un déséquilibre entre deux colonnes.

**Contenu** : Deux colonnes face à face. À gauche, une seule ligne. À droite, sept. Le vide de la colonne gauche est le message.

**Wording**

- Surtitre : `Qui fait quoi`
- H2 : **Votre part du travail tient en une ligne.**
- Sous-titre : Le reste tourne sans vous, y compris quand vous êtes sur l'eau.
- Sous la ligne « Vous » : `Le soir même ou le lendemain, depuis un navigateur.`
- Colonne gauche, intitulé : `Vous`
  - Vous déposez les photos de la sortie.
- Colonne droite, intitulé : `Linktrip`
  - Récupère vos sorties depuis votre plateforme de réservation
  - Crée la galerie et range les photos par créneau
  - Envoie le lien privé par e-mail ou WhatsApp
  - Floute et filigrane les aperçus
  - Relance les clients qui n'ont pas acheté
  - Encaisse le paiement
  - Livre les fichiers haute définition
  - Supprime tout au bout de 90 jours
- Lien de bas de section : `Voir le produit tourner ↓`

---

## 5. Démo

**Objectif** : Montrer le produit avant de le décrire. Reprend la page `/fonctionnement` telle quelle.

**Contenu** : le même mécanisme que l'accueil (`components/marketing/DemoArcade.tsx`), arbitré le 26/08/2026 : trois vignettes inclinées se recouvrent avec un disque de lecture au centre, et le clic ouvre la démo Arcade en plein écran par-dessus la page. Pas d'affiche, pas de cadre 16/9 posé dans la section. La démo est la même que celle de l'accueil et de `/fonctionnement` : identifiant `bPkIR0jKiJ7fvxzUNK0e`, servi par `demo.arcade.software`.

Fonctionnement du plein écran, à reprendre tel quel : l'iframe reste montée en `position:fixed` avec `height:0`, l'ouverture et la fermeture passent par `postMessage` (`arcade-init` → `register-popout-handler`, puis `request-popout-open`, et `arcade-popout-open` / `arcade-popout-close` qui basculent la hauteur et le `z-index`). Le trio est un `<button>` avec `aria-haspopup="dialog"` ; les vignettes sont décoratives (`alt=""`), la description est portée par l'`aria-label` du bouton.

**Wording**

- Surtitre : `La démo`
- H2 : **Regardez, c'est plus rapide que de le lire.**
- Sous-titre : Le dépôt des photos, la galerie du client, la première vente. Une minute quarante.
- Sous le trio : `1 min 40`
- CTA sous la démo (mobile) : `Rejoindre la liste d'attente →`

---

## 6. Simulateur

**Objectif** : Faire calculer au visiteur son propre chiffre. Reprend `/simulation`.

**Contenu** : `RevenueSlider` dans une dalle encre, pour trancher visuellement avec les rangées blanches qui précèdent.

**Wording**

- Surtitre : `Combien ça rapporte`
- H2 : **Faites le calcul avec vos chiffres.**
- Sous-titre : Trois curseurs suffisent.
- Mention sous le résultat : `Estimation, commission déduite.`
- CTA : `Rejoindre la liste d'attente →`

---

> **Sections « Tarif » et « Cadre légal » supprimées le 26/08/2026.** Ce qui part avec elles :
> - **Le prix.** « 0 € par mois, 20 % par vente » et la liste de ce qui est compris ne sont plus dits que par la FAQ (« Combien coûte Linktrip ? »), par la mention « Estimation, commission déduite » sous le simulateur et par la micro-copie du héros (« Sans abonnement · Sans engagement · Sans matériel »). Une page produit qui ne porte plus son modèle économique ailleurs que dans un accordéon replié : à surveiller sur le taux de conversion.
> - **Le droit à l'image et le RGPD.** Consentement du participant, effacement à la demande depuis la galerie, hébergement en Europe : plus rien sur la page. Seule survit la rétention, par la ligne « Supprime tout au bout de 90 jours » du tableau du partage du travail. C'était l'objection la plus fréquente chez un opérateur français, et le lien vers les conditions et la politique de confidentialité ne subsiste qu'au pied de page.
>
> Le lien « Tarif » du pied de page a été retiré. Les activités et la FAQ restent en fond blanc (arbitré le 26/08/2026) : c'est la grille de photos des activités qui coupe la suite de fonds clairs, pas un changement de sol.

---

## 7. Activités couvertes

**Objectif** : Faire dire « c'est pour moi », et alimenter le maillage interne vers les six pages `/activites/*` existantes.

**Contenu** : Six cartes cliquables avec les icônes maison de `ActivityIcons.tsx`.

**Wording**

- H2 : **Pensé pour les sorties où l'on ne peut pas sortir son téléphone.**
- Cartes : `Surf` · `Plongée` · `Canyoning` · `Rafting` · `Parapente` · `Parc aventure`
- Lien : `Votre activité n'est pas dans la liste ? Ça marche pareil.`

---

## 8. FAQ

**Objectif** : Absorber les objections résiduelles sans alourdir les sections hautes.

**Contenu** : Composant `Faq` existant. Cinq questions, écrites dans les mots du visiteur (« Quand est-ce que je suis payé ? », « Il me faut du matériel ? ») : coût, versement, matériel, protection des fichiers, **droit à l'image**.

> **Question « Et le droit à l'image ? » ajoutée le 26/08/2026.** C'est la seule réintroduction volontaire de la refonte : depuis la suppression de la section Cadre légal, l'objection la plus fréquente chez un opérateur français n'avait plus aucune réponse sur la page. À couper si tu préfères la page plus courte, mais alors en connaissance de cause.

**Wording**

- H2 : **Les questions qui reviennent.**
- Lien de fin : `Une autre question ? hello@linktrip.co`

---

## 9. CTA final

**Objectif** : Dernière capture, en reprenant le bandeau e-mail déjà validé au pied de page.

**Wording**

- H2 : **Commencez par votre prochaine sortie.**
- Sous-titre : Laissez votre e-mail, nous vous prévenons dès l'ouverture des comptes.
- Champ e-mail + `Rejoindre la liste d'attente →`

> À confirmer : la mention « ouverture par région » n'est vraie que si le lancement est bien progressif. Sinon : « on vous prévient dès l'ouverture des comptes ».

---

## Métadonnées

- `title` : `Linktrip · Les photos de vos sorties, enfin réglées`
- `description` : `Vous videz votre carte mémoire, chaque client reçoit un lien avec ses photos, et ceux qui veulent les garder paient. Sans abonnement, sans engagement, sans matériel.`

## Règles de wording appliquées

*Deux passes de relecture le 26/08/2026, la seconde sur brief de copywriting senior (clarté, bénéfices, ton premium, phrases courtes).*

- **Le titre dit un bénéfice, pas une fonctionnalité.** « Une boutique photo pour chaque sortie » décrivait l'outil. « Vos clients repartent avec leurs photos. Vous, avec un revenu. » dit ce que chacun y gagne, et donne au passage la raison pour laquelle un opérateur accepterait de vendre à ses propres clients : ils y gagnent aussi.
- **Les puces du héros passent le bénéfice en gras et le fait derrière.** « Une seule action de votre part » avant « vous déposez les photos ». Le lecteur qui ne lit que le gras a déjà les trois arguments.
- **Un titre de section doit se comprendre sans son chapeau.** « Faites le calcul sur votre saison » remplace « Ce que ça peut rapporter sur votre saison » : la même idée, mais une invitation à agir plutôt qu'un constat, et sans « ça ».
- **Nommer sa cible la rassure.** « Ce que les opérateurs nous demandent » remplace « Les questions qu'on nous pose » : le visiteur sait que d'autres comme lui sont passés par là.

- **Nommer le mécanisme, pas la sensation.** « L'argent arrive sur votre compte. Vous ne gérez rien. » est devenu « Les paiements arrivent sur votre compte. Linktrip ne détient jamais les fonds. » Une promesse vague se remplace par le fait qui la rend vraie.
- **Aucun mot de remplissage.** « réellement », « quand même », « déjà là » : rien qui ne porte d'information.
- **Aucune vanne.** « Et vous refermez votre ordinateur » est devenu « Le soir même ou le lendemain, depuis un navigateur » : la place valait mieux qu'un clin d'œil, elle valait un fait.
- **Le « on » disparaît** au profit de « nous » ou d'une tournure directe.
- **Chaque fait n'est dit qu'une fois.** Quand la phrase d'une étape a repris Stripe, la note de la même étape est passée au versement.
- Aucun tiret cadratin dans les textes visibles.
- Un titre court et une phrase par bloc, jamais de liste reprenant le brief.
- Vouvoiement, présent, phrases sans subordonnée.
- Le mot « photo » plutôt que « souvenir » dans les fonctionnalités, « souvenir » réservé aux sections émotionnelles de l'accueil.
