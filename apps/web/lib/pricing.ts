// Moteur de prix — repris tel quel du brief (§6). Le client choisit ses
// photos, le prix suit. Ne facture jamais plus que "toutes les photos".

export interface PricingConfig {
  pricePhotoCents: number;
  pricePackCents: number;
  priceAllCents: number;
  packSize: number;
}

export interface Quote {
  n: number;
  totalCents: number;
  label: string;
  fullCents: number;
}

export function quote(selected: number, paidTotal: number, p: PricingConfig): Quote {
  if (selected === 0) return { n: 0, totalCents: 0, label: "", fullCents: 0 };

  if (selected >= paidTotal) {
    return { n: selected, totalCents: p.priceAllCents, label: "Toutes vos photos", fullCents: selected * p.pricePhotoCents };
  }

  if (selected >= p.packSize) {
    const packs = Math.floor(selected / p.packSize);
    const rest = selected % p.packSize;
    const t = packs * p.pricePackCents + rest * p.pricePhotoCents;
    return {
      n: selected,
      totalCents: Math.min(t, p.priceAllCents),
      label: selected === p.packSize ? `Pack ${p.packSize} photos` : `${selected} photos`,
      fullCents: selected * p.pricePhotoCents,
    };
  }

  return {
    n: selected,
    totalCents: selected * p.pricePhotoCents,
    label: selected === 1 ? "1 photo" : `${selected} photos`,
    fullCents: selected * p.pricePhotoCents,
  };
}

export const REDUCED_OFFER_DISCOUNT_PERCENT = 20;

export function applyReducedOffer(totalCents: number): number {
  return Math.round((totalCents * (100 - REDUCED_OFFER_DISCOUNT_PERCENT)) / 100);
}
