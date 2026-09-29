/**
 * Le vendeur des photos, tel que le client doit le connaître avant de payer
 * et le retrouver sur son reçu.
 *
 * En charge directe, c'est l'opérateur qui vend, pas Linktrip (voir
 * lib/checkout.ts) : le Code de la consommation impose alors son identité et
 * un moyen de le joindre sur l'écran de paiement (L221-5, L111-1), puis sur la
 * confirmation écrite (L221-13). Une donnée manquante est simplement omise,
 * jamais remplacée par un texte de substitution.
 *
 * Ce fichier n'accède pas à la base : les composants client l'importent.
 * La lecture se fait dans lib/seller.ts.
 */
export interface Seller {
  name: string;
  address: string | null;
  siret: string | null;
  email: string | null;
  vatExempt: boolean;
}

/** Le vendeur à partir de la ligne Operator (raison sociale, à défaut le nom affiché). */
export function sellerFromOperator(
  o: { name: string; legalName: string | null; legalAddress: string | null; siret: string | null; vatExempt: boolean },
  email: string | null = null,
): Seller {
  return {
    name: o.legalName?.trim() || o.name,
    address: o.legalAddress?.trim() || null,
    siret: o.siret?.trim() || null,
    email,
    vatExempt: o.vatExempt,
  };
}

/** La date des CGV en vigueur, citée sur chaque reçu. À changer avec app/(legal)/cgv. */
export const CGV_DATE_LABEL = "29 septembre 2026";

/** « 123 456 789 00012 » : le SIRET se lit par groupes. */
export function formatSiret(siret: string): string {
  const digits = siret.replace(/\s+/g, "");
  return /^\d{14}$/.test(digits) ? `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}` : siret;
}

/**
 * L'identité du vendeur en une ligne, pour le pied des reçus :
 * « Base nautique Pierre-Blanche, 4 chemin du Moulin, 04400 Barcelonnette · SIRET 123 456 789 00012 · TVA non applicable, art. 293 B du CGI ».
 */
export function sellerLine(seller: Seller): string {
  const who = [seller.name, seller.address].filter(Boolean).join(", ");
  return [
    who,
    seller.siret ? `SIRET ${formatSiret(seller.siret)}` : null,
    seller.vatExempt ? "TVA non applicable, art. 293 B du CGI" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}
