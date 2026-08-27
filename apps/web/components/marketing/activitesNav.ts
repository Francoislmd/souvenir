import type { ActivitySlug } from "./ActivityIcons";

/* Source unique des noms d'activités.
   Le menu "Activités" du header, le pied de page et la table de
   app/(marketing)/activites/activites.data.ts lisent tous cette liste : le nom
   affiché n'est donc écrit qu'une fois. Ajouter une activité = une ligne ici,
   son pictogramme dans ActivityIcons.tsx et son entrée dans activites.data.ts.
   Ce fichier ne contient QUE des chaînes courtes : il part dans le bundle
   client avec le header, contrairement à activites.data.ts (toute la copy des
   quatorze pages) qui doit rester côté serveur. */

export type Milieu = "eau" | "air" | "terre";

/* L'ordre est celui du menu, groupe par groupe. La grille de bas de page des
   pages d'activité garde le sien : elle lit ACTIVITES, pas cette liste. */
export const NAV_ACTIVITES = [
  { slug: "rafting", nom: "Rafting", milieu: "eau" },
  { slug: "canyoning", nom: "Canyoning", milieu: "eau" },
  { slug: "kayak", nom: "Kayak", milieu: "eau" },
  { slug: "jet-ski", nom: "Jet-ski", milieu: "eau" },
  { slug: "paddle", nom: "Paddle", milieu: "eau" },
  { slug: "surf", nom: "Surf", milieu: "eau" },
  { slug: "plongee", nom: "Plongée", milieu: "eau" },
  { slug: "ski-nautique", nom: "Ski nautique", milieu: "eau" },
  { slug: "bouee", nom: "Bouée tractée", milieu: "eau" },
  { slug: "parapente", nom: "Parapente", milieu: "air" },
  { slug: "helicoptere", nom: "Hélicoptère", milieu: "air" },
  { slug: "tyrolienne", nom: "Tyrolienne", milieu: "air" },
  { slug: "quad", nom: "Quad", milieu: "terre" },
  { slug: "parc-aventure", nom: "Parc aventure", milieu: "terre" },
] as const satisfies readonly { slug: ActivitySlug; nom: string; milieu: Milieu }[];

/* Garde-fou de compilation : une activité présente dans ActivityIcons mais
   absente du menu fait échouer le build ici, pas en production. */
type Manquantes = Exclude<ActivitySlug, (typeof NAV_ACTIVITES)[number]["slug"]>;
const _menuComplet: [Manquantes] extends [never] ? true : never = true;
void _menuComplet;

export const NOM_ACTIVITE = Object.fromEntries(
  NAV_ACTIVITES.map((a) => [a.slug, a.nom]),
) as Record<ActivitySlug, string>;

/* Les trois milieux du menu, dans l'ordre des colonnes. "Sur l'eau" en porte
   neuf sur quatorze : il occupe deux colonnes, les deux autres se partagent la
   troisième (cf. .panelGroups dans landing.module.css). */
export const MILIEUX: { cle: Milieu; titre: string }[] = [
  { cle: "eau", titre: "Sur l’eau" },
  { cle: "air", titre: "Dans les airs" },
  { cle: "terre", titre: "Sur terre" },
];

export const parMilieu = (m: Milieu) => NAV_ACTIVITES.filter((a) => a.milieu === m);
