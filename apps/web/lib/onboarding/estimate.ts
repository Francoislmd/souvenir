export type Bucket = "1-5" | "6-15" | "16-30" | "30+";

// Point médian de chaque tranche — sert de base au calcul d'estimation.
export const BUCKET_MIDPOINT: Record<Bucket, number> = {
  "1-5": 3,
  "6-15": 10,
  "16-30": 22,
  "30+": 42,
};

// Coefficients de l'estimation — indicatifs, à calibrer avec de la donnée réelle.
// monthly = MID[group] * MID[freq] * MONTHLY_MULTIPLIER (mini 20)
// buyers  = monthly * BUYER_RATE
// revenue = buyers * prix du pack
export const MONTHLY_MULTIPLIER = 4.3;
export const BUYER_RATE = 0.35;
export const MIN_MONTHLY_PARTICIPANTS = 20;

export interface RevenueEstimate {
  monthly: number;
  buyers: number;
  revenueCents: number;
}

export function estimateRevenue(group: Bucket, freq: Bucket, packPriceCents: number): RevenueEstimate {
  const monthly = Math.max(
    MIN_MONTHLY_PARTICIPANTS,
    Math.round(BUCKET_MIDPOINT[group] * BUCKET_MIDPOINT[freq] * MONTHLY_MULTIPLIER),
  );
  const buyers = Math.round(monthly * BUYER_RATE);
  const revenueCents = buyers * packPriceCents;

  return { monthly, buyers, revenueCents };
}
