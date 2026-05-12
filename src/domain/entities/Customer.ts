export type CustomerTier = 'diamond' | 'gold' | 'silver' | 'standard';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  tier: CustomerTier;
  birthday?: string;
  totalLTV: number;
  lastPurchaseISO: string;
  totalOrders: number;
  preferences: string[];
  wishlist: string[];
  optInWhatsapp: boolean;
  optInLI: boolean;
  city: string;
}

export interface CustomerSearchInput {
  query: string; // CPF, e-mail, nome
}
