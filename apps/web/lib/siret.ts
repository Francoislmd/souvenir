/**
 * Retrouver une entreprise par son SIRET, dans l'annuaire public de l'État
 * (recherche-entreprises.api.gouv.fr : gratuit, sans clé, données INSEE et
 * RNE). Sert à l'inscription : le pro tape son numéro, on remplit la raison
 * sociale et l'adresse qui figureront sur les reçus de ses clients.
 *
 * Toute panne de l'annuaire rend `null` : l'inscription ne doit jamais en
 * dépendre, le pro peut toujours continuer et corriger dans Réglages.
 */

export interface SiretMatch {
  siret: string;
  /** « Eaux Vives Ardeche » : la raison sociale, sans les capitales de l'INSEE. */
  name: string;
  /** « SAS », « Entrepreneur individuel »… null si la forme n'est pas courante. */
  legalForm: string | null;
  /** « 12 route des Gorges, 07150 Vallon-Pont-d'Arc » */
  address: string | null;
  /** L'établissement est ouvert (état administratif A). */
  active: boolean;
}

// Les formes les plus fréquentes chez les prestataires d'activités. Les autres
// ne s'affichent pas plutôt que de montrer un code à quatre chiffres.
const FORMS: Record<string, string> = {
  "1000": "Entrepreneur individuel",
  "5410": "SARL",
  "5422": "SARL",
  "5426": "SARL",
  "5498": "EURL",
  "5499": "SARL",
  "5710": "SAS",
  "5720": "SASU",
  "9220": "Association",
  "9221": "Association",
  "9222": "Association",
};

const SMALL = new Set(["de", "du", "des", "la", "le", "les", "et", "en", "sur", "sous", "aux", "au", "a"]);

/** Une partie de mot : « arc » → « Arc », « d'arc » → « d'Arc ». */
function capPart(part: string): string {
  const elided = part.match(/^([dl])['’](.+)$/);
  if (elided) return `${elided[1]}'${elided[2]!.charAt(0).toUpperCase()}${elided[2]!.slice(1)}`;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** « EAUX VIVES ARDECHE » → « Eaux Vives Ardeche » ; « VALLON-PONT-D'ARC » → « Vallon-Pont-d'Arc ». */
function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) => {
      if (i > 0 && SMALL.has(word)) return word;
      const out = word.split("-").map(capPart).join("-");
      // En tête de nom, l'élision prend la capitale : « L'Ecole de surf ».
      return i === 0 ? out.charAt(0).toUpperCase() + out.slice(1) : out;
    })
    .join(" ");
}

/** « 12 ROUTE DES GORGES 07150 VALLON-PONT-D'ARC » → « 12 route des Gorges, 07150 Vallon-Pont-d'Arc ». */
function formatAddress(raw: string): string {
  const m = raw.trim().match(/^(.*?)\s*(\d{5})\s+(.+)$/);
  if (!m) return titleCase(raw);
  const [, street, postal, city] = m;
  // Dans la voie, le type reste en minuscules (« route », « chemin ») et le
  // nom prend ses capitales : « route des Gorges ».
  const words = street!.toLowerCase().split(/\s+/).filter(Boolean);
  let typeIndex = words.findIndex((w) => !/^\d/.test(w) && !["bis", "ter"].includes(w));
  if (words[typeIndex] === "lieu" && words[typeIndex + 1] === "dit") typeIndex += 1;
  const streetFmt = words
    .map((w, i) => (i <= typeIndex || SMALL.has(w) || /^\d/.test(w) ? w : w.split("-").map(capPart).join("-")))
    .join(" ");
  return `${streetFmt ? `${streetFmt}, ` : ""}${postal} ${titleCase(city!)}`;
}

interface ApiEstablishment {
  siret?: string;
  adresse?: string;
  etat_administratif?: string;
}
interface ApiResult {
  nom_raison_sociale?: string | null;
  nom_complet?: string | null;
  nature_juridique?: string | null;
  siege?: ApiEstablishment;
  matching_etablissements?: ApiEstablishment[];
}

export function normalizeSiret(input: string): string {
  return input.replace(/\s+/g, "");
}

export async function lookupSiret(input: string): Promise<SiretMatch | null> {
  const siret = normalizeSiret(input);
  if (!/^\d{14}$/.test(siret)) return null;
  try {
    const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=1`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: ApiResult[] };
    const result = data.results?.[0];
    if (!result) return null;
    const establishment =
      result.matching_etablissements?.find((e) => e.siret === siret) ?? (result.siege?.siret === siret ? result.siege : undefined);
    if (!establishment) return null;
    const rawName = result.nom_raison_sociale || result.nom_complet || "";
    return {
      siret,
      name: titleCase(rawName.replace(/\s*\(.*\)\s*$/, "")),
      legalForm: FORMS[result.nature_juridique ?? ""] ?? null,
      address: establishment.adresse ? formatAddress(establishment.adresse) : null,
      active: establishment.etat_administratif === "A",
    };
  } catch (error) {
    console.error("[siret] annuaire injoignable", error);
    return null;
  }
}
