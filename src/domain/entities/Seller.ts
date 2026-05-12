export interface Seller {
  id: string;
  name: string;
  pin: string; // demo only
  storeId: string;
  storeName: string;
  brand: 'vivara' | 'life';
  trainingScore: number;
  monthSales: number;
  monthAOV: number;
  monthConversion: number;
  email?: string; // populado via MSAL quando SSO ativo
}
