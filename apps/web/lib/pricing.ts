// Moteur de prix — repris tel quel du brief (§6). Le client choisit ses
// photos, le prix suit. Ne facture jamais plus que "toutes les photos".

export interface PricingConfig {
  pricePhotoCents: number;
  priceAllCents: number;
}

export interface Quote {
  n: number;
  totalCents: number;
  label: string;
  fullCents: number;
}

export function quote(selected: number, paidTotal: number, p: PricingConfig, allLabel = "Toutes vos photos"): Quote {
  if (selected === 0) return { n: 0, totalCents: 0, label: "", fullCents: 0 };

  if (selected >= paidTotal) {
    return { n: selected, totalCents: p.priceAllCents, label: allLabel, fullCents: selected * p.pricePhotoCents };
  }

  const t = selected * p.pricePhotoCents;
  return {
    n: selected,
    totalCents: Math.min(t, p.priceAllCents),
    label: selected === 1 ? "1 photo" : `${selected} photos`,
    fullCents: t,
  };
}

export const REDUCED_OFFER_DISCOUNT_PERCENT = 20;

export function applyReducedOffer(totalCents: number): number {
  return Math.round((totalCents * (100 - REDUCED_OFFER_DISCOUNT_PERCENT)) / 100);
}
