import type { Bucket } from "./estimate";

export type { Bucket };

export interface Company {
  name: string;
  website: string;
  instagram: string;
  city: string;
}

export type GuidesAnswer = "oui" | "parfois" | "non";

export interface Experience {
  group: Bucket;
  freq: Bucket;
  guides: GuidesAnswer;
}

export type PhotoMode = "guides" | "photographe" | "unsure";

export interface Brand {
  name: string;
  color: string;
  touched: boolean;
}

export interface Pricing {
  packEuros: string;
}

// Sous-ensemble persisté en localStorage pour permettre la reprise (étapes 1-6
// uniquement — jamais les identifiants du compte).
export interface PersistedOnboardingState {
  activities: string[];
  company: Company;
  exp: Experience;
  photoMode: PhotoMode;
  brand: Brand;
  pricing: Pricing;
}
