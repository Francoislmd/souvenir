/* Les quatorze pages /activites/<slug>, en données.
   Portées depuis docs/maquette-activites-v1.html.

   Trois choses à savoir avant d'y toucher :

   1. Le mot de la sortie est une variable. `sortie` porte l'article ("la
      descente", "le vol", "la palanquée"), et TOUS les accords de la page en
      découlent, calculés par `derive()` plus bas. Écrire une phrase en dur
      avec "la sortie" casse la page qui dit "le vol" : passer par les champs
      dérivés. Sans eux on obtient "une fois le vol terminée" ou "la fin de
      le vol".
   2. Les photos sont déjà recadrées au format d'affichage, dans
      `public/landing/activites/`. Le héros est coupé en deux à 50 % : la
      moitié gauche reste nette, la droite est la version `-flou`, floutée
      dans le fichier et jamais par un `filter` CSS. Le sujet doit tomber
      dans le tiers gauche, sinon la moitié qui porte la promesse est vide.
   3. Le troisième moment partage la même photo sur les quatorze pages
      (`carte-memoire.webp`) : c'est le même récit partout, la carte qui reste
      dans le boîtier. Un visiteur ne voit qu'une page à la fois. */

import type { ActivitySlug } from "@/components/marketing/ActivityIcons";
import { NOM_ACTIVITE } from "@/components/marketing/activitesNav";

export interface Moment {
  /** Repère temporel affiché en surtitre, ex. "16 h 40" ou "Dimanche". */
  heure: string;
  titre: string;
  phrase: string;
  /** Nom de fichier dans public/landing/activites/, sans extension. */
  photo: string;
  alt: string;
}

export interface LigneSortie {
  ico: ActivitySlug;
  titre: string;
  sous: string;
  /** Teinte de l'étiquette : verte, orange, ou neutre. */
  etat: "ok" | "attente" | "";
  tag: string;
}

export interface Activite {
  slug: ActivitySlug;
  nom: string;
  /** Fichier du héros dans public/landing/activites/, sans extension ni suffixe. */
  photo: string;
  alt: string;
  /** Titre du héros, coupé pour que la seconde moitié passe en dégradé. */
  h1a: string;
  h1b: string;
  sceneH2: string;
  sceneLead: string;
  moments: Moment[];
  step1: [string, string];
  step2: [string, string];
  /** Étiquette de contexte de la barre de fenêtre de l'écran "Vos sorties". */
  ecran: string;
  rows: LigneSortie[];
  vous: string;
  /** Prix d'exemple affiché sur la carte "Vous les vendez". */
  prix: string;
  /** Questions propres au métier ; les questions communes sont ajoutées après. */
  faq: [string, string][];
  /** Comment l'opérateur se nomme, ex. "les bases de rafting". */
  metier: string;
  /** Ce qu'on vide le soir : "la carte", "le caisson", "la carte de la perche". */
  carte: string;
  /** Unité de rangement des photos : "créneau de départ", "palanquée", "cours". */
  creneau: string;
  /** Le mot de la sortie, article compris. Voir derive(). */
  sortie: string;
  /** Au pluriel et possessif : "vos descentes". */
  sorties: string;
  /** Où se passe la journée, pour le gain du mode boutique : "sur l'eau". */
  journee: string;
  /** Complément du titre de la grille des autres activités : "du rafting". */
  deNom: string;
  /** Titre de l'étape 03, le sujet variant : "Le passager reçoit son lien". */
  quiRecoit: string;
  /** Vrai quand la page pose déjà sa propre question sur les mineurs. */
  sansQuestionMineurs?: boolean;
  /** Exception d'accord : la tyrolienne dit "un seul créneau", pas "un seul passage". */
  uneSeuleForcee?: string;
}

/** Les accords que le mot de la sortie commande. Sans eux, "la fin de le vol". */
export interface Accords {
  /** "La descente" — le mot en tête de phrase. */
  sortieC: string;
  /** "terminée" ou "terminé". */
  terminee: string;
  /** "la même" ou "le même". */
  meme: string;
  /** "de la descente" ou "du vol". */
  deSortie: string;
  /** "toute la descente" ou "tout le vol". */
  entiere: string;
  /** "une seule descente" ou "un seul vol". */
  uneSeule: string;
  /** "toutes vos descentes" ou "tous vos vols". */
  toutes: string;
  /** Le mot nu, sans article : "descente". */
  nu: string;
}

export function derive(a: Activite): Accords {
  const [article, ...reste] = a.sortie.split(" ");
  const nu = reste.join(" ");
  const feminin = article === "la";
  return {
    sortieC: a.sortie.charAt(0).toUpperCase() + a.sortie.slice(1),
    terminee: feminin ? "terminée" : "terminé",
    meme: feminin ? "la même" : "le même",
    deSortie: (feminin ? "de la " : "du ") + nu,
    entiere: (feminin ? "toute la " : "tout le ") + nu,
    uneSeule: a.uneSeuleForcee ?? (feminin ? "une seule " : "un seul ") + nu,
    toutes: (feminin ? "toutes " : "tous ") + a.sorties,
    nu,
  };
}

/* Les cinq questions communes, dans l'ordre où elles suivent les questions
   propres au métier. Celle sur les mineurs saute là où la page la pose déjà. */
export function faqCommune(a: Activite, acc: Accords): [string, string][] {
  const items: [string, string][] = [
    ["Quand est-ce que je suis payé ?",
     "Vous êtes payé par Stripe, comme pour vos réservations. Les fonds vont directement sur votre compte, Linktrip ne les détient jamais."],
    ["Combien ça coûte ?",
     `20 % sur chaque vente, sans abonnement, et 10 % quand le participant achète dans les 24 heures qui suivent la fin ${acc.deSortie}. Si vous préférez offrir vos photos, c'est 29 € par mois, sans engagement.`],
    ["Il me faut du matériel ou du réseau sur place ?",
     "Non. Vous déposez les photos le soir ou le lendemain, depuis un navigateur, où que vous soyez. Il n'y a rien à installer chez vous."],
  ];
  if (!a.sansQuestionMineurs) {
    items.push(["Et les groupes scolaires ou les mineurs ?",
      "Le lien part à l'adresse que vous saisissez, celle de l'accompagnateur. L'accord sur le droit à l'image est demandé avant le téléchargement, et la trace en est conservée."]);
  }
  items.push(["On peut récupérer les photos sans payer ?",
    "L'aperçu est en basse définition et filigrané. Le fichier d'origine n'est délivré qu'après l'achat, ou après l'adresse e-mail si vous avez choisi d'offrir vos photos."]);
  return items;
}

/* Le nom affiché n'est pas dans la table : il vient de activitesNav.ts, que
   lit aussi le menu du header. Un seul endroit à corriger, et le menu ne peut
   pas afficher un autre libellé que la page. */
const TABLE: Omit<Activite, "nom">[] = [
  {
    slug: "rafting",
    photo: "hero-rafting",
    alt: "Quatre participants pagayent dans un raft au passage d'un rapide",
    h1a: "Ils sortent de l'eau et demandent",
    h1b: "les photos.",
    sceneH2: "Vous êtes le seul, ce jour-là, à avoir photographié le rapide.",
    sceneLead: "Le reste de la journée décide si quelqu'un d'autre les verra un jour.",
    moments: [
      { heure: "14 h 20", titre: "Au premier rapide", phrase: "Douze pagaies en l'air, et personne à bord pour appuyer sur le déclencheur.", photo: "rafting-1", alt: "Un raft jaune plein de participants au passage d'un rapide" },
      { heure: "16 h 40", titre: "Au débarquement", phrase: "Ils sortent de l'eau, ils vous remercient, ils demandent où voir les photos.", photo: "rafting-2", alt: "Un raft franchit le seuil, le guide debout à l'arrière" },
      { heure: "Dimanche", titre: "Trois jours plus tard", phrase: "La carte est encore dans le boîtier, avec les quatre cents photos de la semaine.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la descente de 9 h 30", "La date, l'activité, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en rentrant", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Base de Saint-Pierre · Jeudi 27 août",
    rows: [
      { ico: "rafting", titre: "Descente intégrale · 9 h 30", sous: "18 participants · 124 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "rafting", titre: "Descente découverte · 11 h 00", sous: "12 participants · 87 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "rafting", titre: "Descente intégrale · 14 h 00", sous: "22 participants · 196 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "canyoning", titre: "Canyon du Furon · 14 h 30", sous: "9 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis la berge ou depuis le bateau de sécurité, avec le matériel que vous avez déjà.",
    prix: "24 € les 12 photos",
    faq: [
      ["Je photographie avec un reflex depuis la berge et une caméra sur le casque. Ça marche ?",
       "Linktrip prend les fichiers tels qu'ils sortent de l'appareil, reflex, compact étanche ou caméra embarquée. Vous déposez le dossier de la journée, sans renommer ni trier."],
      ["Comment les photos savent à quel groupe elles appartiennent ?",
       "Chaque photo porte son heure de prise de vue. Elle rejoint le créneau qui l'englobe. Le groupe de 9 h 30 ne voit pas la descente de 11 h, et vous pouvez déplacer une photo d'un créneau à l'autre à la main."],
    ],
    metier: "les bases de rafting",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "la descente",
    sorties: "vos descentes",
    journee: "sur l'eau",
    deNom: "du rafting",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "canyoning",
    photo: "hero-canyoning",
    alt: "Un participant descend un toboggan naturel dans le canyon",
    h1a: "Ils ont sauté de huit mètres. Ils veulent",
    h1b: "la photo.",
    sceneH2: "Dans un canyon, personne ne peut photographier sa propre descente.",
    sceneLead: "Vous êtes le seul à avoir les mains libres et un boîtier étanche.",
    moments: [
      { heure: "11 h 20", titre: "Au fond du canyon", phrase: "Il descend le rappel. Les autres attendent en haut, téléphone au fond du sac étanche.", photo: "canyoning-1", alt: "Un descendeur en rappel dans une gorge étroite, vu d'en haut" },
      { heure: "16 h 00", titre: "À la sortie du canyon", phrase: "Les combinaisons remontent, le groupe se photographie entre soi, et repart.", photo: "canyoning-2", alt: "Un groupe en combinaison et casque au bord de l'eau, à la sortie" },
      { heure: "Lundi", titre: "Après le week-end", phrase: "Le boîtier étanche n'a pas été rouvert. Les six descentes du week-end sont dedans.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la descente du Furon", "La date, le canyon, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz le boîtier étanche le soir", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Bureau des guides · Jeudi 27 août",
    rows: [
      { ico: "canyoning", titre: "Furon haut · 9 h 00", sous: "8 participants · 96 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "canyoning", titre: "Écouges intégral · 9 h 30", sous: "6 participants · 141 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "canyoning", titre: "Furon bas · 14 h 00", sous: "12 participants · 88 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "rafting", titre: "Rafting Drac · 14 h 30", sous: "16 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis le relais ou depuis la vasque, avec le boîtier étanche que vous avez déjà.",
    prix: "24 € les 15 photos",
    faq: [
      ["En combinaison intégrale et casque, on ne reconnaît personne. C'est un problème ?",
       "Non, parce que vous n'attribuez pas les photos à une personne. Chaque participant de la descente reçoit le lien de la descente et retrouve ses passages lui-même."],
      ["Mon boîtier étanche horodate mal les photos.",
       "Vous pouvez décaler l'heure de tout un lot en une fois au moment du dépôt, ou déplacer une photo d'un créneau à l'autre à la main."],
    ],
    metier: "les bureaux de guides",
    carte: "le boîtier étanche",
    creneau: "créneau de départ",
    sortie: "la descente",
    sorties: "vos descentes",
    journee: "dans le canyon",
    deNom: "du canyoning",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "kayak",
    photo: "hero-kayak",
    alt: "Un groupe de kayaks de couleur sur la rivière, sous un pont",
    h1a: "La photo de la traversée, ils la veulent",
    h1b: "le soir même.",
    sceneH2: "Sur l'eau, aucun d'eux n'a le bon angle sur lui-même.",
    sceneLead: "Vous l'avez, depuis le kayak d'accompagnement, du départ au retour.",
    moments: [
      { heure: "9 h 00", titre: "Au départ de la plage", phrase: "Les kayaks sont alignés sur le sable, le groupe se met à l'eau. Personne ne photographie.", photo: "kayak-1", alt: "Des kayaks alignés sur une plage, le groupe se met à l'eau" },
      { heure: "17 h 00", titre: "Au retour", phrase: "Les pagaies rejoignent le sable, le groupe se disperse vers le parking.", photo: "kayak-2", alt: "Un kayak et deux pagaies posés sur le sable, vus du dessus" },
      { heure: "Mercredi", titre: "Trois jours plus tard", phrase: "Les photos sont sur la carte, dans le tiroir du local à matériel.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la sortie de 9 h 00", "La date, le parcours, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte au retour du local", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Base nautique de Kerlouan · Jeudi 27 août",
    rows: [
      { ico: "kayak", titre: "Traversée des îles · 9 h 00", sous: "14 participants · 102 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "kayak", titre: "Initiation en baie · 11 h 00", sous: "10 participants · 64 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "kayak", titre: "Randonnée côtière · 14 h 00", sous: "18 participants · 173 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "paddle", titre: "Paddle coucher de soleil · 19 h 00", sous: "8 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis votre kayak d'accompagnement, avec le compact étanche que vous avez déjà.",
    prix: "18 € les 10 photos",
    faq: [
      ["Je guide et je photographie en même temps, ce n'est pas tenable.",
       "La plupart des bases font trois séries courtes, au départ, à la pause et au retour. C'est déjà ce que les participants achètent."],
      ["Je fais deux sorties qui se croisent sur l'eau.",
       "Les photos se rangent à l'heure de prise de vue, dans le créneau qui les englobe. Deux groupes croisés restent deux galeries distinctes."],
    ],
    metier: "les bases nautiques",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "la sortie",
    sorties: "vos sorties",
    journee: "sur l'eau",
    deNom: "du kayak",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "jet-ski",
    photo: "hero-jet-ski",
    alt: "Un jet-ski de trois quarts au virage, gerbe d'eau derrière",
    h1a: "Ils veulent la photo du jet",
    h1b: "en plein virage.",
    sceneH2: "Sur l'eau, personne ne peut se photographier soi-même.",
    sceneLead: "Vous êtes le seul à passer devant eux pendant la randonnée.",
    moments: [
      { heure: "15 h 10", titre: "Au large", phrase: "Il ouvre les gaz. Il ne verra jamais à quoi il ressemble à cet instant.", photo: "jet-ski-1", alt: "Une pilote debout sur un jet-ski vert, en virage" },
      { heure: "16 h 30", titre: "Au retour au ponton", phrase: "Les jets rentrent au mouillage. Les adresses restent sur les contrats de location.", photo: "jet-ski-2", alt: "Une rangée de jet-skis amarrés le long d'un ponton, vue du ciel" },
      { heure: "Vendredi", titre: "En fin de semaine", phrase: "Cinq randonnées photographiées depuis le jet d'ouverture. Personne ne les a vues.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la randonnée de 15 h 00", "La date, le parcours, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en fermant la base", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Base de Palavas · Jeudi 27 août",
    rows: [
      { ico: "jet-ski", titre: "Randonnée découverte · 10 h 00", sous: "6 participants · 74 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "jet-ski", titre: "Randonnée 2 h · 15 h 00", sous: "8 participants · 118 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "jet-ski", titre: "Initiation permis · 17 h 00", sous: "4 participants · 41 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "bouee", titre: "Bouée tractée · 18 h 00", sous: "10 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis le jet d'ouverture ou depuis le bateau d'accompagnement.",
    prix: "19 € les 10 photos",
    faq: [
      ["Mes clients laissent déjà leur adresse sur le contrat de location.",
       "Vous la saisissez au moment de créer la randonnée, ou vous collez la liste depuis votre logiciel de location. Le participant n'a rien à remplir."],
      ["Je fais huit randonnées par jour en haute saison.",
       "Chaque randonnée est un créneau. Vous déposez la journée en une fois le soir, et les huit galeries partent seules."],
    ],
    metier: "les bases de jet-ski",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "la randonnée",
    sorties: "vos randonnées",
    journee: "sur l'eau",
    deNom: "du jet-ski",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "paddle",
    photo: "hero-paddle",
    alt: "Trois paddles en silhouette sur l'eau, au lever du soleil",
    h1a: "Le lever de soleil sur la baie, ils veulent",
    h1b: "le garder.",
    sceneH2: "Une session de paddle finit toujours par un téléphone resté dans un casier.",
    sceneLead: "Debout sur une planche, personne ne sort son téléphone.",
    moments: [
      { heure: "7 h 20", titre: "À la mise à l'eau", phrase: "Ils descendent les planches à l'eau. Les téléphones restent dans les casiers.", photo: "paddle-1", alt: "Un groupe porte des planches de paddle rouges vers l'eau" },
      { heure: "9 h 00", titre: "Au retour sur la plage", phrase: "Les planches remontent sur le rack. Le groupe se sépare sur le parking.", photo: "paddle-2", alt: "Des planches de paddle rangées côte à côte sur le sable" },
      { heure: "Dimanche", titre: "En fin de semaine", phrase: "Six sessions dans la carte, et le dimanche soir passe sans que rien ne parte.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la session de 7 h 00", "La date, le parcours, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en rangeant les planches", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "École de paddle · Jeudi 27 août",
    rows: [
      { ico: "paddle", titre: "Session lever de soleil · 7 h 00", sous: "9 participants · 88 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "paddle", titre: "Initiation · 10 h 00", sous: "12 participants · 71 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "paddle", titre: "Paddle yoga · 11 h 30", sous: "8 participants · 54 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "kayak", titre: "Kayak en baie · 14 h 00", sous: "11 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis votre planche ou depuis la plage, avec le téléphone étanche que vous avez déjà.",
    prix: "15 € les 10 photos",
    faq: [
      ["Je n'ai qu'un téléphone, pas d'appareil photo.",
       "C'est suffisant. Vous déposez les fichiers du téléphone comme ceux d'un appareil, depuis le téléphone lui-même ou depuis l'ordinateur."],
      ["Mes sessions se ressemblent toutes, les photos aussi.",
       "C'est le lever de soleil du jour où ils étaient là qu'ils achètent, pas la photo la plus réussie de la saison."],
    ],
    metier: "les écoles de paddle",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "la session",
    sorties: "vos sessions",
    journee: "sur l'eau",
    deNom: "du paddle",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "surf",
    photo: "hero-surf",
    alt: "Un moniteur reprend la position d'un élève sur sa planche, sur le sable",
    h1a: "La première vague debout, elle",
    h1b: "ne repasse pas.",
    sceneH2: "Le cours se termine, la plage se vide, et la photo reste dans votre boîtier.",
    sceneLead: "Le jour où un élève se lève pour la première fois, il n'a personne sur la plage.",
    moments: [
      { heure: "10 h 40", titre: "Dans la mousse", phrase: "Le premier se lève. Il ne le sait pas encore, et personne sur la plage ne le photographie.", photo: "surf-1", alt: "Des élèves en combinaison poussent leurs planches dans la mousse" },
      { heure: "12 h 00", titre: "Au retour vers l'école", phrase: "Ils remontent la plage avec les planches, ils demandent s'il y a des photos.", photo: "surf-2", alt: "Deux surfeurs remontent la plage, planche sous le bras, en fin de journée" },
      { heure: "Dimanche", titre: "En fin de semaine", phrase: "Douze cours dans la carte, et personne pour trier.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez le cours de 10 h 30", "La date, le niveau, l'heure de début. Ou vos cours descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en fermant l'école", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le cours qui correspond à son heure de prise de vue."],
    ecran: "École de surf · Jeudi 27 août",
    rows: [
      { ico: "surf", titre: "Cours collectif · 8 h 30", sous: "10 élèves · 143 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "surf", titre: "Cours débutant · 10 h 30", sous: "12 élèves · 168 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "surf", titre: "Stage ados · 14 h 00", sous: "8 élèves · 121 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "paddle", titre: "Paddle découverte · 17 h 00", sous: "6 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis la plage au téléobjectif, ou depuis l'eau, avec le matériel que vous avez déjà.",
    prix: "22 € les 12 photos",
    faq: [
      ["Comment on reconnaît un élève parmi douze en combinaison noire ?",
       "Vous n'avez pas à le faire. Chaque élève du cours de 10 h 30 reçoit le lien du cours de 10 h 30, et retrouve ses vagues lui-même dans la galerie."],
      ["Mes élèves reviennent toute la semaine.",
       "Chaque cours est une galerie. Un élève qui revient cinq jours reçoit cinq liens, et peut acheter la semaine entière."],
    ],
    metier: "les écoles de surf",
    carte: "la carte",
    creneau: "cours",
    sortie: "le cours",
    sorties: "vos cours",
    journee: "sur la plage",
    deNom: "du surf",
    quiRecoit: "Les élèves reçoivent leur lien",
  },
  {
    slug: "tyrolienne",
    photo: "hero-tyrolienne",
    alt: "Une participante suspendue à la tyrolienne, en forêt",
    h1a: "Sur la tyrolienne, il n'y a qu'un",
    h1b: "seul bon angle.",
    sceneH2: "Le seul point d'où l'on voit son visage, c'est votre plateforme d'arrivée.",
    sceneLead: "Le passage dure onze secondes, et il n'a lieu qu'une fois.",
    moments: [
      { heure: "14 h 10", titre: "Sur le câble", phrase: "Onze secondes au-dessus de la vallée, et un seul point de vue pour les prendre.", photo: "tyrolienne-1", alt: "Deux personnes glissent sur une tyrolienne au-dessus d'une vallée" },
      { heure: "17 h 30", titre: "Au décrochage", phrase: "Il rend son mousqueton, encore rouge, et demande si vous l'avez pris.", photo: "tyrolienne-2", alt: "Un participant casqué tient son baudrier, juste après le passage" },
      { heure: "Lundi", titre: "Après le week-end", phrase: "Trois cents passages photographiés en deux jours, tous dans la même carte.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez le créneau de 14 h 00", "La date, la ligne, l'heure de passage. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte de la plateforme d'arrivée", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Parc de la Vallée · Jeudi 27 août",
    rows: [
      { ico: "tyrolienne", titre: "Grande tyrolienne · 10 h 00", sous: "24 passages · 96 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "tyrolienne", titre: "Grande tyrolienne · 14 h 00", sous: "31 passages · 128 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "parc-aventure", titre: "Parcours acrobatique · 14 h 30", sous: "18 participants · 154 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "tyrolienne", titre: "Saut pendulaire · 16 h 00", sous: "9 passages · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis la plateforme d'arrivée, avec l'appareil qui y est déjà posé.",
    prix: "12 € les 6 photos",
    faq: [
      ["Mon appareil est déclenché à distance depuis la plateforme.",
       "Cela ne change rien. Du moment que les fichiers arrivent sur une carte ou dans un dossier, vous les déposez le soir."],
      ["Un passage, c'est trois photos utiles sur quarante.",
       "Vous déposez tout, et vous retirez ce que vous ne voulez pas montrer avant d'envoyer les liens."],
    ],
    metier: "les parcs de tyroliennes",
    carte: "la carte",
    creneau: "créneau de passage",
    sortie: "le passage",
    sorties: "vos passages",
    journee: "dans les arbres",
    deNom: "de la tyrolienne",
    quiRecoit: "Le groupe reçoit son lien",
    uneSeuleForcee: "un seul créneau",
  },
  {
    slug: "quad",
    photo: "hero-quad",
    alt: "Un quad au passage du gué, projection d'eau",
    h1a: "Ils reviennent couverts de boue, et",
    h1b: "fiers de l'être.",
    sceneH2: "La photo du groupe crotté, c'est celle qu'ils envoient à tout le monde.",
    sceneLead: "Elle se prend à un seul endroit du parcours, et vous savez lequel.",
    moments: [
      { heure: "11 h 40", titre: "Au passage du gué", phrase: "Vous êtes en tête, vous vous retournez, et c'est là que la photo se prend.", photo: "quad-1", alt: "Les mains d'un pilote sur le guidon d'un quad, dans la boue" },
      { heure: "12 h 30", titre: "Au retour au hangar", phrase: "Les quads rentrent, les casques se posent, le groupe repart vers les voitures.", photo: "quad-2", alt: "Des quads rangés sous un auvent, en fin de randonnée" },
      { heure: "Mardi", titre: "Deux jours plus tard", phrase: "La carte est encore dans le local, entre deux bidons d'huile.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la randonnée de 9 h 30", "La date, le circuit, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en rentrant les quads", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Base quad du Causse · Jeudi 27 août",
    rows: [
      { ico: "quad", titre: "Randonnée 2 h · 9 h 30", sous: "12 participants · 108 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "quad", titre: "Randonnée découverte · 11 h 00", sous: "8 participants · 63 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "quad", titre: "Rando journée · 14 h 00", sous: "14 participants · 231 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "quad", titre: "Buggy biplace · 16 h 30", sous: "6 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis le quad d'ouverture, aux points de regroupement, avec l'appareil que vous avez déjà.",
    prix: "20 € les 12 photos",
    faq: [
      ["Je photographie toujours au même endroit du circuit.",
       "C'est exactement ce qui fonctionne : un point de vue repéré, la même série à chaque passage. Le rangement par créneau fait le reste."],
      ["Mon appareil prend la poussière, je photographie au téléphone.",
       "Vous déposez les fichiers du téléphone comme ceux d'un appareil, depuis le téléphone ou depuis l'ordinateur."],
    ],
    metier: "les bases de quad",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "la randonnée",
    sorties: "vos randonnées",
    journee: "sur les pistes",
    deNom: "du quad",
    quiRecoit: "Le groupe reçoit son lien",
  },
  {
    slug: "parapente",
    photo: "hero-parapente",
    alt: "Le passager et le pilote en vol biplace, vus depuis la perche",
    h1a: "Sur un biplace, le passager ne peut",
    h1b: "pas se photographier.",
    sceneH2: "La perche est déjà accrochée à votre élévateur. Le reste se passe à l'atterrissage.",
    sceneLead: "Vous êtes le seul à pouvoir rapporter une image de son vol.",
    moments: [
      { heure: "11 h 15", titre: "En vol", phrase: "Le passager ne regarde que devant. C'est vous qui déclenchez, la perche au bout du bras.", photo: "parapente-1", alt: "Une voile de parapente en vol au-dessus d'un relief" },
      { heure: "11 h 50", titre: "Au pliage", phrase: "Il plie la voile avec vous et demande comment récupérer les photos.", photo: "parapente-2", alt: "Une voile étalée au sol, en cours de pliage après l'atterrissage" },
      { heure: "Dimanche", titre: "Après le week-end", phrase: "Quatorze biplaces dans la carte de la perche, et la navette repart déjà.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez le vol de 11 h 00", "La date, le type de vol, l'heure de décollage. Ou vos vols descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte de la perche", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le vol qui correspond à son heure de prise de vue."],
    ecran: "École de Saint-Hilaire · Jeudi 27 août",
    rows: [
      { ico: "parapente", titre: "Biplace découverte · 10 h 30", sous: "1 passager · 62 photos", etat: "ok", tag: "Lien envoyé" },
      { ico: "parapente", titre: "Biplace performance · 11 h 00", sous: "1 passager · 84 photos", etat: "ok", tag: "Lien envoyé" },
      { ico: "parapente", titre: "Biplace découverte · 14 h 00", sous: "1 passager · 58 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "parapente", titre: "Stage initiation · 15 h 00", sous: "6 élèves · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à déclencher depuis la perche, pendant le vol, exactement comme aujourd'hui.",
    prix: "29 € les 20 photos",
    faq: [
      ["Je photographie avec une caméra sur perche, les fichiers sont énormes.",
       "Vous déposez les fichiers d'origine. Linktrip génère l'aperçu léger que voit le passager et garde l'original pour la livraison."],
      ["Un biplace, c'est un passager. Ça vaut le coup pour une seule personne ?",
       "Le lien part à la personne, pas au groupe. Un vol par heure suffit à faire une galerie par heure."],
    ],
    metier: "les écoles de parapente",
    carte: "la carte de la perche",
    creneau: "créneau de décollage",
    sortie: "le vol",
    sorties: "vos vols",
    journee: "en l'air",
    deNom: "du parapente",
    quiRecoit: "Le passager reçoit son lien",
  },
  {
    slug: "helicoptere",
    photo: "hero-helicoptere",
    alt: "Deux passagers rejoignent l'hélicoptère sur l'aire d'embarquement",
    h1a: "La photo devant l'appareil, ils la veulent",
    h1b: "tous.",
    sceneH2: "Avant l'embarquement, tout le monde veut la même photo devant la machine.",
    sceneLead: "Elle se prend en trente secondes, et elle se vend après le vol.",
    moments: [
      { heure: "10 h 50", titre: "Sur l'aire d'embarquement", phrase: "Ils posent devant la machine, casque à la main, et se photographient les uns les autres.", photo: "helicoptere-1", alt: "Deux passagers rejoignent l'hélicoptère sur l'aire d'embarquement" },
      { heure: "11 h 05", titre: "En vol", phrase: "Vingt minutes derrière la vitre. Ce qu'ils rapportent, ce sont des reflets.", photo: "helicoptere-2", alt: "Des passagers installés dans la cabine, casque sur les oreilles" },
      { heure: "Dimanche", titre: "Après la journée", phrase: "Neuf rotations, neuf groupes, une seule carte mémoire.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la rotation de 11 h 00", "La date, le circuit, l'heure de décollage. Ou vos rotations descendent seules de votre plateforme de réservation."],
    step2: ["Videz la carte entre deux rotations", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint la rotation qui correspond à son heure de prise de vue."],
    ecran: "Héliport du lac · Jeudi 27 août",
    rows: [
      { ico: "helicoptere", titre: "Vol panoramique · 10 h 30", sous: "4 passagers · 38 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "helicoptere", titre: "Vol panoramique · 11 h 00", sous: "5 passagers · 44 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "helicoptere", titre: "Baptême 20 min · 14 h 00", sous: "3 passagers · 29 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "helicoptere", titre: "Transfert privé · 16 h 00", sous: "2 passagers · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier sur l'aire d'embarquement, entre deux rotations, avec l'appareil de l'accueil.",
    prix: "25 € les 8 photos",
    faq: [
      ["Mes rotations s'enchaînent toutes les vingt minutes.",
       "Les photos se rangent à l'heure de prise de vue. Vous n'avez rien à trier entre deux rotations, même quand elles s'enchaînent."],
      ["Je vends déjà un tirage papier à l'accueil.",
       "La galerie ne le remplace pas. Elle attrape ceux qui sont partis sans passer par le comptoir."],
    ],
    metier: "les opérateurs de vols panoramiques",
    carte: "la carte",
    creneau: "rotation",
    sortie: "la rotation",
    sorties: "vos rotations",
    journee: "sur l'aire",
    deNom: "des vols panoramiques",
    quiRecoit: "Les passagers reçoivent leur lien",
  },
  {
    slug: "plongee",
    photo: "hero-plongee",
    alt: "Un plongeur au-dessus du récif",
    h1a: "Sous l'eau, il n'y a",
    h1b: "que vous avec un appareil.",
    sceneH2: "Ils remontent avec un souvenir que personne d'autre ne peut leur donner.",
    sceneLead: "Un baptême ne se refait pas, et le téléphone est resté au sec.",
    moments: [
      { heure: "9 h 40", titre: "Au mouillage", phrase: "Le bateau se met sur zone. Dans dix minutes, plus personne n'aura de téléphone.", photo: "plongee-1", alt: "Un semi-rigide chargé de plongeurs se met sur zone" },
      { heure: "12 h 00", titre: "Au retour à l'échelle", phrase: "Ils remontent, ils rincent le matériel, ils demandent s'il y a des photos.", photo: "plongee-2", alt: "Un plongeur refait surface en combinaison, détendeur en main" },
      { heure: "Dimanche", titre: "Après le week-end", phrase: "Le caisson n'a pas été ouvert. Vingt palanquées attendent dedans.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la palanquée de 10 h 00", "La date, le site, l'heure de mise à l'eau. Ou vos palanquées descendent seules de votre plateforme de réservation."],
    step2: ["Videz le caisson en rentrant", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint la palanquée qui correspond à son heure de prise de vue."],
    ecran: "Centre de plongée · Jeudi 27 août",
    rows: [
      { ico: "plongee", titre: "Baptême · 9 h 00", sous: "2 plongeurs · 46 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "plongee", titre: "Exploration tombant · 10 h 00", sous: "6 plongeurs · 112 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "plongee", titre: "Formation Niveau 1 · 14 h 00", sous: "4 plongeurs · 78 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "plongee", titre: "Randonnée palmée · 16 h 30", sous: "11 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier pendant la palanquée, avec le caisson que vous avez déjà.",
    prix: "26 € les 15 photos",
    faq: [
      ["Les photos sous l'eau sortent bleues, il faut les corriger.",
       "Vous déposez les fichiers tels quels ou déjà corrigés. Linktrip ne retouche pas vos images, il en fait seulement l'aperçu protégé."],
      ["Une palanquée, c'est deux personnes. Ça vaut le coup ?",
       "Le lien part à chaque plongeur. Une palanquée de deux fonctionne comme un groupe de vingt, en plus court."],
    ],
    metier: "les centres de plongée",
    carte: "le caisson",
    creneau: "palanquée",
    sortie: "la palanquée",
    sorties: "vos palanquées",
    journee: "sous l'eau",
    deNom: "de la plongée",
    quiRecoit: "Les plongeurs reçoivent leur lien",
  },
  {
    slug: "parc-aventure",
    photo: "hero-parc-aventure",
    alt: "Un groupe casqué sur un pont de singe, dans les arbres",
    h1a: "Les parents sont en bas,",
    h1b: "l'enfant est en haut.",
    sceneH2: "Le meilleur angle du parcours n'est pas accessible depuis le sol.",
    sceneLead: "Ce qu'ils rapportent, c'est une silhouette à contre-jour dans les arbres.",
    moments: [
      { heure: "14 h 20", titre: "Sur le parcours", phrase: "L'enfant passe d'un arbre à l'autre. En bas, les parents photographient une ombre.", photo: "parc-aventure-1", alt: "Des participants encordés progressent d'une plateforme à l'autre" },
      { heure: "16 h 00", titre: "Au retour des baudriers", phrase: "Le matériel revient à l'accueil. Le groupe repart sans avoir laissé d'adresse.", photo: "parc-aventure-2", alt: "Une corde nouée sur une structure du parcours, en gros plan" },
      { heure: "Lundi", titre: "Après le week-end", phrase: "Deux cents passages photographiés depuis les plateformes, tous dans les mêmes cartes.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez la session de 14 h 00", "La date, le parcours, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz les cartes des plateformes", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Parc de la forêt · Jeudi 27 août",
    rows: [
      { ico: "parc-aventure", titre: "Session 2 h · 10 h 00", sous: "26 participants · 187 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "parc-aventure", titre: "Session 2 h · 14 h 00", sous: "34 participants · 241 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "parc-aventure", titre: "Parcours enfants · 14 h 30", sous: "18 participants · 96 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "tyrolienne", titre: "Grande tyrolienne · 16 h 00", sous: "12 passages · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis les plateformes, ou à laisser tourner les appareils des ateliers photo du parcours.",
    prix: "16 € les 10 photos",
    faq: [
      ["La moitié de mes clients sont mineurs. Comment ça se passe ?",
       "Le lien part à l'adresse que vous saisissez, celle du parent ou de l'accompagnateur. L'accord sur le droit à l'image est demandé avant le téléchargement, et la trace en est conservée."],
      ["J'ai un appareil par atelier, ça fait cinq cartes.",
       "Vous déposez les cinq dossiers dans la même journée. Les photos se répartissent par créneau, quelle que soit la carte d'où elles viennent."],
    ],
    metier: "les parcs aventure",
    carte: "les cartes des plateformes",
    creneau: "créneau de départ",
    sortie: "la session",
    sorties: "vos sessions",
    journee: "dans les arbres",
    deNom: "du parcours acrobatique",
    quiRecoit: "Le groupe reçoit son lien",
    sansQuestionMineurs: true,
  },
  {
    slug: "ski-nautique",
    photo: "hero-ski-nautique",
    alt: "Une skieuse tractée, le bateau derrière elle",
    h1a: "Le premier départ réussi,",
    h1b: "il n'a pas de témoin.",
    sceneH2: "Depuis le bateau, vous avez le seul angle qui montre son visage.",
    sceneLead: "Sur la berge, on ne voit qu'une gerbe d'eau et une silhouette.",
    moments: [
      { heure: "10 h 15", titre: "Au premier départ tenu", phrase: "Il sort de l'eau et tient trente secondes. Sur la berge, personne ne regarde.", photo: "ski-nautique-1", alt: "Un bateau tracte un skieur, gerbe d'eau derrière lui" },
      { heure: "19 h 00", titre: "Quand le lac se vide", phrase: "Le dernier passage est fait. Le bateau rentre au ponton, la carte reste à bord.", photo: "ski-nautique-2", alt: "Le lac au calme en fin de journée, un bateau au loin" },
      { heure: "Dimanche", titre: "Après le week-end", phrase: "Quarante passages dans la carte du bateau, et le lundi arrive.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez le créneau de 10 h 00", "La date, la discipline, l'heure de passage. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte du bateau le soir", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Téléski nautique · Jeudi 27 août",
    rows: [
      { ico: "ski-nautique", titre: "Cours débutant · 9 h 30", sous: "6 participants · 92 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "ski-nautique", titre: "Passage libre · 10 h 00", sous: "14 passages · 158 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "ski-nautique", titre: "Wakeboard · 14 h 00", sous: "9 participants · 121 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "bouee", titre: "Bouée tractée · 16 h 00", sous: "12 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis le bateau, au retour de chaque passage.",
    prix: "17 € les 10 photos",
    faq: [
      ["Je fais passer dix personnes dans le même créneau. Chacun voit tout ?",
       "Oui. Tous les participants du créneau voient les photos du créneau, chacun repère les siennes et n'achète que celles-là."],
      ["Un passage dure deux minutes, j'enchaîne sans m'arrêter.",
       "Vous n'avez rien à faire entre deux passages. Le tri à l'heure de prise de vue se fait au dépôt, le soir."],
    ],
    metier: "les clubs de ski nautique",
    carte: "la carte du bateau",
    creneau: "créneau de passage",
    sortie: "le passage",
    sorties: "vos passages",
    journee: "sur l'eau",
    deNom: "du ski nautique",
    quiRecoit: "Le groupe reçoit son lien",
    uneSeuleForcee: "un seul créneau",
  },
  {
    slug: "bouee",
    photo: "hero-bouee",
    alt: "Trois participants sur une bouée tractée, au large",
    h1a: "Ils tombent tous.",
    h1b: "C'est ça, la photo.",
    sceneH2: "Le moment où la bouée décroche est celui que tout le monde veut revoir.",
    sceneLead: "Il dure une seconde, et il se produit à chaque tour.",
    moments: [
      { heure: "16 h 05", titre: "Au premier virage", phrase: "La bouée décroche, ils partent à l'eau, et tout le monde crie.", photo: "bouee-1", alt: "Vue du ciel, un bateau tracte une bouée dans un virage serré" },
      { heure: "16 h 30", titre: "Au tour suivant", phrase: "Un autre groupe embarque. Le premier est déjà reparti vers la plage.", photo: "bouee-2", alt: "Un bateau tracte une bouée chargée de participants en gilet" },
      { heure: "Dimanche", titre: "En fin de semaine", phrase: "Trente tours en deux jours. Une carte, aucune adresse.", photo: "carte-memoire", alt: "Un boîtier photo et ses cartes mémoire, posés à plat" },
    ],
    step1: ["Créez le tour de 16 h 00", "La date, l'engin, l'heure de départ. Ou vos créneaux descendent seuls de votre plateforme de réservation."],
    step2: ["Videz la carte en fermant la base", "Vous glissez la journée entière dans le navigateur. Chaque photo rejoint le créneau qui correspond à son heure de prise de vue."],
    ecran: "Base nautique · Jeudi 27 août",
    rows: [
      { ico: "bouee", titre: "Bouée tractée · 15 h 30", sous: "8 participants · 64 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "bouee", titre: "Bouée tractée · 16 h 00", sous: "10 participants · 81 photos", etat: "ok", tag: "Liens envoyés" },
      { ico: "jet-ski", titre: "Jet-ski randonnée · 17 h 00", sous: "6 participants · 58 photos", etat: "attente", tag: "Dépôt en cours" },
      { ico: "paddle", titre: "Paddle · 19 h 00", sous: "9 participants · en attente de photos", etat: "", tag: "À déposer" },
    ],
    vous: "Vous continuez à photographier depuis le bateau tracteur, avec le compact étanche que vous avez déjà.",
    prix: "14 € les 8 photos",
    faq: [
      ["Un tour dure dix minutes, j'en fais trente par jour.",
       "Chaque tour est un créneau. Les photos s'y rangent seules, et le lien part au groupe du tour."],
      ["Mes clients sont mineurs pour la plupart.",
       "Le lien part à l'adresse que vous saisissez, celle du parent ou de l'accompagnateur. L'accord sur le droit à l'image est demandé avant le téléchargement."],
    ],
    metier: "les bases nautiques",
    carte: "la carte",
    creneau: "créneau de départ",
    sortie: "le tour",
    sorties: "vos tours",
    journee: "sur l'eau",
    deNom: "de la bouée tractée",
    quiRecoit: "Le groupe reçoit son lien",
    sansQuestionMineurs: true,
  },
];

export const ACTIVITES: Activite[] = TABLE.map((a) => ({ ...a, nom: NOM_ACTIVITE[a.slug] }));

export const PAR_SLUG = new Map(ACTIVITES.map((a) => [a.slug, a]));

